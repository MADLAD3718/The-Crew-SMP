import { TicksPerSecond, world } from "@minecraft/server";

world.afterEvents.projectileHitEntity.subscribe(event => {
    if (event.projectile.typeId !== "tcsmp:cannabis_arrow") return;
    event.getEntityHit()?.entity.addEffect("nausea", 15 * TicksPerSecond);
    event.getEntityHit()?.entity.addEffect("blindness", 15 * TicksPerSecond);
});
