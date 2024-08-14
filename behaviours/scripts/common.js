import { Block, Container, ItemStack } from "@minecraft/server";
import { add, div, mul, sub, toVec } from "./extensions/vectors";
import "./extensions/items";

/** @typedef {{min: Number, max: Number}} NumberRange */
/** @typedef {{x: Number, y: Number, z: Number}} Vector3 */

/**
 * Tests if a number is within a number range, inclusive.
 * @param {Number} x The specified number.
 * @param {NumberRange} range The specified number range.
 * @returns {Boolean} `true` if the number is in the number range, else `false`.
 */
export function withinRange(x, range) {
    return x >= range.min && x <= range.max;
}

/**
 * Picks an element at random from an array.
 * @param {*[]} array The spcified array.
 * @returns {*} A random element from the array.
 */
export function randElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Determines if a block is water.
 * @param {Block} block The specified block.
 * @returns {Boolean} `true` if the block is a water block, otherwise `false`.
 */
export function isWater(block) {
    return block?.typeId == "minecraft:water" || block?.typeId == "minecraft:flowing_water";
}

/**
 * Decrements the itemstack count in the provided slot.
 * @param {Container} container The specified inventory container.
 * @param {Number} slot The specified container slot.
 */
export function decrementSlot(container, slot) {
    if (slot >= container.size) return;
    const item = container.getItem(slot);
    if (item.amount > 1) {
        item.amount--;
        container.setItem(slot, item);
    } else container.setItem(slot);
}

/**
 * Decrements the durability of an item.
 * @param {ItemStack} item The specified item.
 * @returns {ItemStack | undefined}
 */
export function decrementDurability(item) {
    if (item.durability.damage == item.durability.maxDurability) return undefined;
    const level = item.enchantments.getEnchantment("unbreaking")?.level ?? 0;
    if (Math.random() >= 1 / (level + 1)) return item;
    item.durability.damage++;
    return item;
}

/**
 * Duplicates an item and optionally changes its typeId.
 * If a new typeId is provided, the new item must have 
 * the same components and values in its definition.
 * @param {ItemStack} itemStack The specified item.
 * @param {String} [typeId] The typeId of the resulting item.
 * @returns {ItemStack} A duplicate item with the optionally provided typeId.
 */
export function duplicateItem(itemStack, typeId) {
    const item = new ItemStack(typeId ?? itemStack.typeId);
    item.amount = itemStack.amount;
    item.nameTag = itemStack.nameTag;
    const damage = itemStack.durability?.damage;
    if (damage) item.durability.damage = damage;
    const enchantments = itemStack.enchantments?.getEnchantments();
    if (enchantments) item.enchantments.addEnchantments(enchantments);
    return item;
}


/**
 * Generates a list of locations bounded by a rectangular prism.
 * @param {Vector3} range The length of each semi-axis.
 * @returns {Vector3[]} A list of locations within a rectangular prism centered about the origin.
 */
export function getRectPrism(range) {
    const span = add(mul(range, 2), toVec(1));
    const locations = new Array(span.x * span.y * span.z);
    let i = 0;
    for (let x = 0; x <= 2 * range.x; ++x)
    for (let y = 0; y <= 2 * range.y; ++y)
    for (let z = 0; z <= 2 * range.z; ++z, ++i) {
        locations[i] = sub({x: x, y: y, z: z}, range);
    }
    return locations;
}

/**
 * @param {Vector3} range 
 * @param {Vector3} position 
 */
export function ellipsoidValue(range, position) {
    const pos2 = mul(position, position);
    const ran2 = mul(range, range);
    const quo = div(pos2, ran2);
    return quo.x + quo.y + quo.z;
}
