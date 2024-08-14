import { Dimension, Entity, GameMode, ItemStack, MolangVariableMap, Player, system, TicksPerSecond, world } from "@minecraft/server";
import { add, Directions, mul, normalize } from "../extensions/vectors";
import { buildTNB } from "../extensions/matrices";
import { decrementSlot } from "../common";
import "../extensions/entities";
import "../extensions/classes";

const CANNON_DELAY = 1.0 * TicksPerSecond;

world.afterEvents.entitySpawn.subscribe(event => {
    const {entity} = event;
    if (entity.typeId !== "tcsmp:cannon") return;
    entity.dimension.playSound("cannon.place", entity.location);
});

world.afterEvents.entityHitEntity.subscribe(event => {
    const {hitEntity: cannon, damagingEntity} = event;
    if (cannon.typeId !== "tcsmp:cannon" || !(damagingEntity instanceof Player)) return;

    const rider = cannon.getRiders()?.[0];
    if (rider?.id === damagingEntity.id) {
        const time = cannon.getDynamicProperty("cannon_fire_time") ?? 0;
        if (system.currentTick - time < CANNON_DELAY) return;
        const gunpowder = cannon.inventory.container.findIndex(isGunpowder);
        const cannonball = cannon.inventory.container.findIndex(isAmmo);
        if (gunpowder !== -1 && cannonball !== -1) {
            const ball_item = cannon.inventory.container.getItem(cannonball);
            decrementSlot(cannon.inventory.container, gunpowder);
            decrementSlot(cannon.inventory.container, cannonball);
            
            const view = rider.getViewDirection(), origin = add(cannon.location, Directions.Up);
            const direction = normalize({x: view.x, y: Math.max(view.y, 0), z: view.z});
            const velocity = mul(direction, 3);

            const ball = cannon.dimension.spawnEntity(ball_item.typeId, add(velocity, origin));
            ball.projectile.owner = rider;

            spawnCannonParticles(cannon.dimension, add(origin, mul(direction, 2)), direction);
            cannon.dimension.playSound("cannon.fire", cannon.location, {pitch: 0.5 * Math.random() + 0.75});
            ball.projectile.shoot(velocity);
        } else cannon.dimension.playSound("cannon.light", cannon.location);
        cannon.setDynamicProperty("cannon_fire_time", system.currentTick);
    } else {
        if (damagingEntity?.getGameMode() !== GameMode.creative)
            cannon.dimension.spawnItem(new ItemStack("tcsmp:cannon_item"), cannon.location);
        dropInventory(cannon);
        cannon.dimension.playSound("cannon.break", cannon.location);
        cannon.remove();
    }
});

/**
 * Determines if an item is valid ammo for the cannon.
 * @param {ItemStack} item 
 * @returns {Boolean} True if the item is cannon ammo.
 */
function isAmmo(item) {
    return item?.hasTag("tcsmp:cannon_ammo") ?? false;
}

/** @param {ItemStack} item  */
function isGunpowder(item) {
    return item?.typeId == "minecraft:gunpowder";
}

/**
 * Spawns the cannon smoke particles according to the given parameters.
 * @param {Dimension} dimension 
 * @param {Vector3} location 
 * @param {Vector3} direction 
 */
function spawnCannonParticles(dimension, location, direction) {
    const molang_map = new MolangVariableMap;
    const tnb = buildTNB(direction);
    for (let i = 0; i < 3; ++i) {
        molang_map.setVector3("direction", tnb.mul(randCap(0.5)));
        dimension.spawnParticle("tcsmp:cannon_smoke", location, molang_map);
    }
}

/**
 * Generates a random direction within a spherical cap distribution.
 * @param {Number} r The radius of the cap.
 * @returns {Vector3}
 */
export function randCap(r) {
    const u = Math.random() * (1 - Math.sqrt(1 - r * r));
    const sint = Math.sqrt(u * (2 - u));
    const phi = 2 * Math.PI * Math.random();
    return {
        x: Math.cos(phi) * sint,
        y: 1 - u,
        z: Math.sin(phi) * sint
    };
}

/**
 * Drops the inventory of the entity.
 * @param {Entity} entity 
 */
function dropInventory(entity) {
    const container = entity.inventory.container;
    for (let i = 0; i < container.size; ++i) {
        const item = container.getItem(i);
        if (!item) continue;
        entity.dimension.spawnItem(item, entity.location);
    }
}
