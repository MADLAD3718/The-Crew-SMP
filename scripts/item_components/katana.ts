import { Vec3 } from "@madlad3718/mcveclib";
import { Entity, EntityDamageCause, GameMode, ItemComponentTypes, ItemCustomComponent, ItemLockMode, ItemStack, MolangVariableMap, system, TicksPerSecond, world } from "@minecraft/server";
import { MinecraftEnchantmentTypes } from "@minecraft/vanilla-data";
import KatanaDefinition from "../../behaviours/items/katana.item.json";

const MAX_DURATION = TicksPerSecond * KatanaDefinition["minecraft:item"].components["minecraft:use_modifiers"].use_duration;
const USE_TIME = TicksPerSecond * 0.5;
const DASH_SPEED = 4.0;
const AIR_DASH_SPEED = 0.75;
const DASH_TIME = TicksPerSecond * 0.2;

const ParticleIntervals: Record<string, number> = {};

world.afterEvents.itemReleaseUse.subscribe(event => {
    const { source: player, itemStack, useDuration } = event;
    const particles = ParticleIntervals[player.id];
    if (particles) system.clearRun(particles);

    if (!player.isValid || player.isGliding ||
        !itemStack?.hasComponent("tcsmp:katana")) return;

    const { dimension } = player;

    if (MAX_DURATION - useDuration < USE_TIME)
        return player.stopSound("katana.draw");


    const head = player.getHeadLocation();
    player.dimension.playSound("katana.dash", head);

    const view = player.getViewDirection();
    const direction = Vec3.normalize(Vec3.from(view.x, 0, view.z));
    if (!player.isOnGround || player.isInWater)
        return player.applyImpulse(Vec3.mul(direction, AIR_DASH_SPEED));

    player.applyImpulse(Vec3.mul(direction, DASH_SPEED));

    const molang = new MolangVariableMap();
    molang.setVector3("direction", direction);
    dimension.spawnParticle("tcsmp:katana_dash", player.location, molang);

    const slot = player.inventory.container.getSlot(player.selectedSlotIndex);
    slot.lockMode = ItemLockMode.slot;

    let ticks = 0, hits = 0;
    const hitEntityIds: string[] = [];
    const interval = system.runInterval(() => {
        const entities = dimension.getEntities({
            location: player.location,
            maxDistance: 4.5,
            excludeNames: [player.name],
            excludeTypes: ["minecraft:item"]
        });

        for (const entity of entities) {
            if (hitEntityIds.find(id => id === entity.id)) continue;
            const to_entity = Vec3.sub(entity.location, player.location);
            if (Vec3.dot(to_entity, direction) < 0) continue;

            hits += +applyKatanaDamage(itemStack, player, entity);
            hitEntityIds.push(entity.id);
        }

        if (ticks === DASH_TIME) {
            slot.lockMode = ItemLockMode.none;
            if (player.getGameMode() !== GameMode.Creative && hits) {
                slot.setItem(itemStack.damage(hits));

                if (!slot.hasItem()) dimension.playSound(
                    "random.break",
                    player.getHeadLocation(),
                    { pitch: 0.9 }
                );
            }
            return system.clearRun(interval);
        } else ++ticks;
    });
});

function applyKatanaDamage(katana: ItemStack, attacker: Entity, target: Entity): boolean {
    const undead = target.matches({ families: ["undead"] });
    const arthropod = target.matches({ families: ["arthropod"] });

    const enchantable = katana.getComponent(ItemComponentTypes.Enchantable);
    const getEnchantmentLevel = (id: MinecraftEnchantmentTypes) => enchantable?.getEnchantment(id)?.level ?? 0;

    const bane_of_arthropods = getEnchantmentLevel(MinecraftEnchantmentTypes.BaneOfArthropods);
    const fire_aspect = getEnchantmentLevel(MinecraftEnchantmentTypes.FireAspect);
    const sharpness = getEnchantmentLevel(MinecraftEnchantmentTypes.Sharpness);
    const smite = getEnchantmentLevel(MinecraftEnchantmentTypes.Smite);

    const sharp_damage = Math.floor(1.25 * sharpness);
    const smite_damage = undead ? Math.floor(2.5 * smite) : 0;
    const bane_damage = arthropod ? Math.floor(2.5 * bane_of_arthropods) : 0;

    const damage = 6 + sharp_damage + smite_damage + bane_damage;
    const onFireTime = 4 * fire_aspect;

    const hit = target.applyDamage(damage, {
        cause: EntityDamageCause.entityAttack,
        damagingEntity: attacker
    });
    if (hit && onFireTime) target.setOnFire(onFireTime);

    return hit;
}

const katanaComponent: ItemCustomComponent = {
    onUse({ source: player }) {
        if (!player.isValid || player.isGliding) return;

        // Restart the sound in case it didn't
        // finish playing in the previous use
        player.stopSound("katana.draw");
        player.playSound("katana.draw");

        const particles = ParticleIntervals[player.id];
        if (particles) system.clearRun(particles);

        const { dimension } = player;
        ParticleIntervals[player.id] = system.runInterval(() => {
            if (!player.isValid) return system.clearRun(ParticleIntervals[player.id]);
            dimension.spawnParticle("tcsmp:katana_charge", player.location);
        }, 2);
    }
}

export default katanaComponent;
