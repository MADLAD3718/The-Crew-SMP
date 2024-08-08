import { Container, Dimension, Entity, EntityComponentTypes, GameMode, ItemStack, MolangVariableMap, Player, system, TicksPerSecond, world } from "@minecraft/server";
import { add, Directions, mul, normalize } from "../extensions/vectors";
import { buildTNB } from "../extensions/matrices";

const CANNON_DELAY = 1.0 * TicksPerSecond;

world.afterEvents.entitySpawn.subscribe(event => {
    if (event.entity.typeId !== "tcsmp:cannon") return;
    event.entity.dimension.playSound("cannon.place", event.entity.location);
});

world.afterEvents.entityHitEntity.subscribe(event => {
    const {hitEntity: cannon, damagingEntity} = event;
    if (cannon.typeId !== "tcsmp:cannon" || !(damagingEntity instanceof Player)) return;

    const rider = cannon.getComponent(EntityComponentTypes.Rideable).getRiders()[0];
    if (rider?.id === damagingEntity.id) {
        const time = rider.getDynamicProperty("cannon_fire_time") ?? 0;
        if (system.currentTick - time < CANNON_DELAY) return;
        const gunpowder = findItem("minecraft:gunpowder", cannon.inventory.container);
        const cannonball = findAmmo(cannon.inventory.container);
        if (gunpowder !== undefined && cannonball !== undefined) {
            const ball_item = cannon.inventory.container.getItem(cannonball);
            decrementSlot(cannon.inventory.container, gunpowder);
            decrementSlot(cannon.inventory.container, cannonball);
            
            const view = rider.getViewDirection(), origin = add(cannon.location, Directions.Up);
            const direction = normalize({x: view.x, y: Math.max(view.y, 0), z: view.z});
            const velocity = mul(direction, 3);

            const ball = cannon.dimension.spawnEntity(ball_item.typeId, add(velocity, origin));
            const projectile = ball.getComponent(EntityComponentTypes.Projectile);
            projectile.owner = rider;

            spawnCannonParticles(cannon.dimension, add(origin, mul(direction, 2)), direction);
            cannon.dimension.playSound("cannon.fire", cannon.location, {pitch: 0.5 * Math.random() + 0.75});
            projectile.shoot(velocity);

            rider.setDynamicProperty("cannon_fire_time", system.currentTick);
        }
    } else {
        if (damagingEntity?.getGameMode() !== GameMode.creative)
            cannon.dimension.spawnItem(new ItemStack("tcsmp:cannon"), cannon.location);
        dropInventory(cannon);
        cannon.dimension.playSound("cannon.break", cannon.location);
        cannon.remove();
    }
});

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
 * Finds the first instance of an item in a container.
 * @param {String} itemId
 * @param {Container} container 
 * @returns {Number | undefined}
 */
function findItem(itemId, container) {
    for (let i = 0; i < container.size; ++i) {
        const item = container.getItem(i);
        if (item?.typeId === itemId) return i;
    }
    return undefined;
}

/**
 * Finds the first instance of a cannon ammo item in a container.
 * @param {Container} container 
 * @returns {Number | undefined}
 */
function findAmmo(container) {
    for (let i = 0; i < container.size; ++i) {
        const item = container.getItem(i);
        if (item?.getTags().includes("cannon_ammo")) return i;
    }
    return undefined;
}

/**
 * Decrements the itemstack count in the provided slot.
 * @param {Container} container 
 * @param {Number} slot 
 */
function decrementSlot(container, slot) {
    if (slot >= container.size) return;
    const item = container.getItem(slot);
    if (item.amount == 1) {
        container.setItem(slot);
    } else {
        item.amount--;
        container.setItem(slot, item);
    }
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
