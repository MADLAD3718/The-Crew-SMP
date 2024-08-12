import { Block } from "@minecraft/server";

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
