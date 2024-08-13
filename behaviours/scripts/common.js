import { Block, Container, ItemStack } from "@minecraft/server";
import "./extensions/items";

/** @typedef {{min: Number, max: Number}} NumberRange */

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
