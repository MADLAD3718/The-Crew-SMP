import { EntityDamageCause, ItemStack, system, TicksPerSecond, world } from "@minecraft/server";
import { div, dot, length, mul, normalize, reject, sub, Unit } from "../extensions/vectors";
import "../extensions/entities";
import "../extensions/items";

const USE_TIME = TicksPerSecond * 0.5;
const MAX_DURATION = TicksPerSecond * 500;
const DASH_DISTANCE = 15.0;
const DASH_DAMAGE_BONUS = 3;

world.afterEvents.itemReleaseUse.subscribe(event => {
    const {itemStack, useDuration, source: player} = event;
    if (itemStack.typeId !== "tcsmp:katana") return;
    if (MAX_DURATION - useDuration <= USE_TIME) return;
    if (!player.isOnGround) return;

    const final_speed = 0.05;
    const initial_speed = (final_speed + 0.454 * DASH_DISTANCE) / 0.400274734;
    const time = Math.log(initial_speed / final_speed) / 0.605136303 - 1;

    const direction = normalize(reject(player.getViewDirection(), Unit.Up));
    player.applyImpulse(mul(direction, initial_speed));

    const start_tick = system.currentTick, entityIds = [];
    const task = system.runInterval(() => {
        const ticks = system.currentTick - start_tick;
        if (ticks >= time) return system.clearRun(task);
        const query = {location: player.location, maxDistance: 5.0};
        for (const entity of player.dimension.getEntities(query)) {
            if (entityIds.includes(entity.id)) continue;
            const to_entity = sub(entity.location, player.location);
            const dist = length(to_entity);
            const move_dir = normalize(player.getVelocity());
            if (dot(move_dir, div(to_entity, dist)) < 0.0) continue;
            entityIds.push(entity.id);
            const damage_options = {
                cause: EntityDamageCause.entityAttack,
                damagingEntity: player
            }
            entity.applyDamage(getKatanaDamage(itemStack) + DASH_DAMAGE_BONUS, damage_options);
        }
    });
});

/** @param {ItemStack} katana */
function getKatanaDamage(katana) {
    const sharpness = katana.enchantments.getEnchantment("minecraft:sharpness");
    const level = sharpness?.level ?? 0;
    return 6 + Math.floor(1.25 * level);
}
