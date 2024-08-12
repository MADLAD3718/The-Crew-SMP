import { Block } from "@minecraft/server";

/**
 * Determines if a block is water.
 * @param {Block} block The specified block.
 * @returns {Boolean} `true` if the block is a water block, otherwise `false`.
 */
export function isWater(block) {
    return block?.typeId == "minecraft:water" || block?.typeId == "minecraft:flowing_water";
}
