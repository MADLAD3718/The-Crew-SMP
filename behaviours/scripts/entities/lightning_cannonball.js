import {ProjectileHitBlockAfterEvent, ProjectileHitEntityAfterEvent, world} from "@minecraft/server";

world.afterEvents.projectileHitBlock.subscribe(event => {
    if (event.projectile.typeId === "tcsmp:lightning_cannonball") lightningCannonballHit(event);
});

world.afterEvents.projectileHitEntity.subscribe(event => {
    if (event.projectile.typeId === "tcsmp:lightning_cannonball") lightningCannonballHit(event);
});

/** @param {ProjectileHitBlockAfterEvent | ProjectileHitEntityAfterEvent} event */
function lightningCannonballHit(event) {
    const {dimension, location} = event;
    dimension.spawnEntity("minecraft:lightning_bolt", location);
}