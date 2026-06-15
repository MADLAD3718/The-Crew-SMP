import { Entity, EntityDamageCause, GameMode, ItemComponentTypes, ItemCustomComponent, ItemStack, MolangVariableMap, system, TicksPerSecond, world } from "@minecraft/server";
import { MinecraftEnchantmentTypes } from "@minecraft/vanilla-data";
import KatanaDefinition from "../../behaviours/items/katana.item.json";
import { Vec3 } from "@madlad3718/mcveclib";

const MAX_DURATION = TicksPerSecond * KatanaDefinition["minecraft:item"].components["minecraft:use_modifiers"].use_duration;
const USE_TIME = TicksPerSecond * 0.5;
const DASH_SPEED = 4.0;
const AIR_DASH_SPEED = 0.75;
const DASH_TIME = TicksPerSecond * 0.2;

const ParticleIntervals: Record<string, number> = {};

world.afterEvents.itemReleaseUse.subscribe(event => {
    const { source, itemStack, useDuration } = event, { dimension } = source;
    if (!itemStack?.hasComponent("tcsmp:katana")) return;

    const particles = ParticleIntervals[source.id];
    if (particles) system.clearRun(particles);

    if (MAX_DURATION - useDuration < USE_TIME)
        return source.stopSound("katana.draw");
    
    const head = source.getHeadLocation();
    source.dimension.playSound("katana.dash", head);

    const view = source.getViewDirection();
    const speed = source.isOnGround && !source.isInWater ? DASH_SPEED : AIR_DASH_SPEED;
    const direction = Vec3.normalize(Vec3.reject(view, Vec3.Up));
    if (speed == AIR_DASH_SPEED) return source.applyImpulse(Vec3.mul(direction, speed));

    source.applyImpulse(Vec3.mul(direction, speed));

    const molang = new MolangVariableMap();
    molang.setVector3("direction", direction);
    dimension.spawnParticle("tcsmp:katana_dash", source.location, molang);

    const slot = source.inventory.container.getSlot(source.selectedSlotIndex);
    let item = slot.getItem();

    let ticks = 0, hits = 0;
    const hitEntityIds: string[] = [];
    const interval = system.runInterval(() => {
        const entities = dimension.getEntities({
            location: source.location,
            maxDistance: 4.5,
            excludeNames: [source.name],
            excludeTypes: ["minecraft:item"]
        });

        for (const entity of entities) {
            if (hitEntityIds.find(id => id == entity.id)) continue;
            const to_entity = Vec3.sub(entity.location, source.location);
            if (Vec3.dot(to_entity, direction) < 0) continue;

            hits += applyKatanaDamage(item!, source, entity) ? 1 : 0;
            hitEntityIds.push(entity.id);
        }

        if (ticks == DASH_TIME) {
            if (source.getGameMode() != GameMode.Creative && hits) {
                item = item!.damage(hits);
                slot?.setItem(item);
                
                if (!item) dimension.playSound(
                    "random.break",
                    source.getHeadLocation(),
                    { pitch: 0.9 }
                );
            }
            system.clearRun(interval);
        } else ++ticks;
    });
});

function applyKatanaDamage(katana: ItemStack, attacker: Entity, target: Entity): boolean {
    const undead = target.matches({families: ["undead"]});
    const arthropod = target.matches({families: ["arthropod"]});

    const enchantable = katana.getComponent(ItemComponentTypes.Enchantable);
    
    const sharpness = enchantable?.getEnchantment(MinecraftEnchantmentTypes.Sharpness)?.level ?? 0;
    const smite = enchantable?.getEnchantment(MinecraftEnchantmentTypes.Smite)?.level ?? 0;
    const bane_of_arthropods = enchantable?.getEnchantment(MinecraftEnchantmentTypes.BaneOfArthropods)?.level ?? 0;
    const fire_aspect = enchantable?.getEnchantment(MinecraftEnchantmentTypes.FireAspect)?.level ?? 0;

    const sharp_damage = Math.floor(1.25 * sharpness);
    const smite_damage = undead ? Math.floor(2.5 * smite) : 0;
    const bane_damage = arthropod ? Math.floor(2.5 * bane_of_arthropods) : 0;

    const damage = 6 + sharp_damage + smite_damage + bane_damage;
    const onFireTime = 4 * fire_aspect;

    const hit = target.applyDamage(damage, {cause: EntityDamageCause.entityAttack, damagingEntity: attacker});
    if (hit && onFireTime) target.setOnFire(onFireTime, true);

    return hit;
}

const katanaComponent: ItemCustomComponent = {
    onUse({ source }) {
        // Why are we stopping this?
        source.stopSound("katana.draw");
        source.playSound("katana.draw");

        const particles = ParticleIntervals[source.id];
        if (particles) system.clearRun(particles);

        const { dimension } = source;
        ParticleIntervals[source.id] = system.runInterval(() => {
            dimension.spawnParticle("tcsmp:katana_charge", source.location);
        }, 2);
    }
}

export default katanaComponent;
