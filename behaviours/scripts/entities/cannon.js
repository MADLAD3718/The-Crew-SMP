import { Container, Entity, EntityComponentTypes, GameMode, ItemStack, Player, system, TicksPerSecond, world } from "@minecraft/server";
import { add, Directions, length, mul } from "../extensions/vectors";

const CANNON_DELAY = 1.0 * TicksPerSecond;

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
            const direction = {x: view.x, y: Math.max(view.y, 0), z: view.z};
            const velocity = mul(direction, 3 / length(direction));

            const ball = cannon.dimension.spawnEntity(ball_item.typeId, add(velocity, origin));
            ball.getComponent(EntityComponentTypes.Projectile).shoot(velocity);

            rider.setDynamicProperty("cannon_fire_time", system.currentTick);
        }
    } else {
        if (damagingEntity?.getGameMode() !== GameMode.creative)
            cannon.dimension.spawnItem(new ItemStack("tcsmp:cannon"), cannon.location);
        dropInventory(cannon);
        cannon.remove();
    }
});

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
