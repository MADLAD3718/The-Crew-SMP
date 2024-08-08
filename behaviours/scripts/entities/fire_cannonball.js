import {ProjectileHitBlockAfterEvent, ProjectileHitEntityAfterEvent, world} from "@minecraft/server";

world.afterEvents.projectileHitBlock.subscribe(event => {
    if (event.projectile.typeId === "tcsmp:fire_cannonball") fireCannonballHit(event);
});

world.afterEvents.projectileHitEntity.subscribe(event => {
    if (event.projectile.typeId === "tcsmp:fire_cannonball") fireCannonballHit(event);
});

/** @param {ProjectileHitBlockAfterEvent | ProjectileHitEntityAfterEvent} event */
function fireCannonballHit(event) {
    const targets = event.dimension.getEntities({location: event.location, maxDistance: 10});
    for (const target of targets) target.setOnFire(10);
}