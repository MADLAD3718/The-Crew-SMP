import { Entity, EntityDamageCause, GameMode, ItemComponentTypes, ItemCustomComponent, ItemStack, MolangVariableMap, system, TicksPerSecond, world } from "@minecraft/server";
import { MinecraftEnchantmentTypes } from "@minecraft/vanilla-data";
import { Vec3 } from "@madlad3718/mcveclib";

const USE_TIME = TicksPerSecond * 0.5;
const MAX_DURATION = TicksPerSecond * 500;
const DASH_SPEED = 10.0;
const DASH_TIME = TicksPerSecond * 0.2;

const PARTICLE_MAP: Map<string, number> = new Map();

world.afterEvents.itemReleaseUse.subscribe(event => {
    const { source, itemStack, useDuration } = event;
    const { dimension } = source;
    if (itemStack?.typeId != "tcsmp:katana") return;

    const particles = PARTICLE_MAP.get(source.id);
    if (particles) system.clearRun(particles);

    if (MAX_DURATION - useDuration < USE_TIME)
        return source.stopSound("katana.draw");
    
    const head = source.getHeadLocation();
    source.dimension.playSound("katana.dash", head);

    const view = source.getViewDirection();
    const speed = source.isOnGround && !source.isInWater ? DASH_SPEED : 1.0;
    const direction = Vec3.normalize(Vec3.reject(view, Vec3.Up));
    if (speed == 1.0) return source.applyImpulse(Vec3.mul(direction, speed));

    source.applyImpulse(Vec3.mul(direction, speed));

    const molang = new MolangVariableMap();
    molang.setVector3("direction", direction);
    dimension.spawnParticle("tcsmp:katana_dash", source.location, molang);

    const slot = source.inventory.container?.getSlot(source.selectedSlotIndex);
    let item = slot?.getItem();

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

            hits += applyKatanaDamage(item as ItemStack, source, entity) ? 1 : 0;
            hitEntityIds.push(entity.id);
        }

        if (ticks == DASH_TIME) {
            if (source.getGameMode() != GameMode.creative && hits) {
                for (let i = 0; i < hits; ++i)
                    item = item?.damage();
                slot?.setItem(item);
                
                if (!item) dimension.playSound("random.break", source.getHeadLocation());
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
        source.stopSound("katana.draw");
        source.playSound("katana.draw");

        const particles = PARTICLE_MAP.get(source.id);
        if (particles) system.clearRun(particles);

        const { dimension } = source;
        PARTICLE_MAP.set(source.id, system.runInterval(() => {
            dimension.spawnParticle("tcsmp:katana_charge", source.location);
        }, 2));
    }
}

export default katanaComponent;
