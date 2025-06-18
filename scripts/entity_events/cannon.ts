import { DimensionLocation, Entity, EntityProjectileComponent, GameMode, MolangVariableMap, Player, Vector3, world } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { Mat3, RandVec, Vec3 } from "@madlad3718/mcveclib";

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (!entity.isValid) return;
    if (!entity.matches({type: "tcsmp:cannon"})) return;

    entity.dimension.playSound("cannon.place", entity.location);
});

world.afterEvents.entityHitEntity.subscribe(event => {
    if (!event.hitEntity.isValid) return;
    if (!event.hitEntity.matches({type: "tcsmp:cannon"})) return;
    
    const cannon = event.hitEntity, player = event.damagingEntity as Player;
    const rider: Entity | undefined = event.hitEntity.getRiders()[0];
    const { dimension } = cannon;

    if (!rider) {
        dimension.playSound("cannon.break", cannon.location);
        if (player.getGameMode() == GameMode.Survival)
            player.dimension.spawnLoot(cannon.location, "blocks/cannon");
        cannon.dropInventory();
        cannon.remove();
    }
    else if (rider.id == player.id) {
        const container = cannon.inventory?.container;
        const ammo = container?.find(item => item.hasTag("tcsmp:cannon_ammo"));
        const fuel = container?.find(item => item.typeId == MinecraftItemTypes.Gunpowder);
        if (ammo && fuel) {
            dimension.playSound("cannon.fire", cannon.location, {pitch: 0.5 * Math.random() + 0.75});

            const view = player.getViewDirection(), origin = Vec3.above(cannon.location);
            const direction = Vec3.normalize(Vec3.from(view.x, Math.max(view.y, 0), view.z));
            const velocity = Vec3.mul(direction, 2);

            const ball = dimension.spawnEntity(ammo.typeId, Vec3.add(origin, velocity));
            const projectile = ball.projectile as EntityProjectileComponent;
            projectile.owner = player;

            spawnSmoke({dimension, ...ball.location}, direction);
            projectile.shoot(velocity);
            ammo.decrement();
            fuel.decrement();
        } else dimension.playSound("cannon.light", cannon.location);
    }
}, {entityTypes: ["minecraft:player"]});

function spawnSmoke(origin: DimensionLocation, direction: Vector3) {
    const molang_map = new MolangVariableMap();
    const tnb = Mat3.buildTNB(direction);
    for (let i = 0; i < 3; ++i) {
        molang_map.setVector3("direction", Mat3.mul(tnb, RandVec.cap(0.5)));
        origin.dimension.spawnParticle("tcsmp:cannon_smoke", origin, molang_map);
    }
}
