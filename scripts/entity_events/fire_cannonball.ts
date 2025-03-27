import { ProjectileHitBlockAfterEvent, ProjectileHitEntityAfterEvent, world } from "@minecraft/server";

world.afterEvents.projectileHitBlock.subscribe(event => {
    if (!event.projectile.isValid()) return;
    if (event.projectile.matches({type: "tcsmp:fire_cannonball"})) hit(event);
});

world.afterEvents.projectileHitEntity.subscribe(event => {
    if (!event.projectile.isValid()) return;
    if (event.projectile.matches({type: "tcsmp:fire_cannonball"})) hit(event);
})

function hit(event: ProjectileHitBlockAfterEvent | ProjectileHitEntityAfterEvent) {
    const targets = event.dimension.getEntities({location: event.location, maxDistance: 10});
    for (const target of targets) target.setOnFire(10);    
}