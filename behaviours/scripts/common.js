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
 * Finds the first instance of an ItemStack with a speified typeId.
 * @param {Container} container 
 * @param {String} typeId 
 * @returns {Number | undefined} The slot index the item was found at.
 */
export function findItem(container, typeId) {
    for (let i = 0; i < container.size; ++i) {
        const item = container.getItem(i);
        if (item?.typeId == typeId) return i;
    }
    return undefined;
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
