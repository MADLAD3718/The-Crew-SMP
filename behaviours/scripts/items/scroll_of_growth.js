import { Block, ItemComponentUseEvent, TicksPerSecond } from "@minecraft/server";
import { add, div, dot, mul, sub, toVec } from "../extensions/vectors";

const GROWTH_RANGE = {x: 15, y: 8, z: 15};
const SHORT_PLANTS = [
    "minecraft:short_grass",
    "minecraft:fern",
    "minecraft:dandelion",
    "minecraft:poppy",
    "minecraft:blue_orchid",
    "minecraft:allium",
    "minecraft:azure_bluet",
    "minecraft:red_tulip",
    "minecraft:orange_tulip",
    "minecraft:white_tulip",
    "minecraft:pink_tulip",
    "minecraft:oxeye_daisy",
    "minecraft:cornflower",
    "minecraft:lily_of_the_valley"
]
const TALL_PLANTS = [
    "minecraft:tall_grass",
    "minecraft:large_fern",
    "minecraft:lilac",
    "minecraft:rose_bush",
    "minecraft:peony"
]
const REGEN_IMMUNE = [
    "tcsmp:cannon",
    "tcsmp:cannonball",
    "tcsmp:fire_cannonball",
    "tcsmp:grappling_hook_seat",
    "tcsmp:grappling_hook_stake",
    "tcsmp:poison_cannonball",
    "tcsmp:slowness_cannonball",
    "tcsmp:warp_crystal",
    "tcsmp:wither_cannonball"
]

/** @type {import("@minecraft/server").ItemCustomComponent} */
export const growthSpellComponent = {
    onUse: useGrowthSpell
}

/** @param {ItemComponentUseEvent} event  */
function useGrowthSpell(event) {
    const {source} = event, {dimension, location} = source;
    for (const offset of getRectPrism(GROWTH_RANGE)) {
        const value = ellipsoidValue(GROWTH_RANGE, offset);
        if (value > 1) continue;

        const target = add(location, offset);
        if (!withinRange(target.y, dimension.heightRange)) continue;

        const block = dimension.getBlock(target);
        applyGrowth(block, value);
    }
    const nearby_entities = dimension.getEntities({
        volume: add(mul(GROWTH_RANGE, 2), toVec(1)),
        location: sub(source.location, GROWTH_RANGE)
    });
    for (const entity of nearby_entities) {
        const offset = sub(entity.location, location);
        if (ellipsoidValue(GROWTH_RANGE, offset) > 1) continue;
        if (REGEN_IMMUNE.includes(entity.typeId)) continue;
        entity.addEffect("regeneration", 15 * TicksPerSecond);
        try {
            entity.triggerEvent("minecraft:ageable_grow_up");
        } catch {}
    }
}

/**
 * @param {Block} block 
 * @param {Number} value 
 */
function applyGrowth(block, value) {
    const {dimension, permutation} = block;
    switch (block.typeId) {
        case "minecraft:air":
            if (block.y == dimension.heightRange.min) break;
            if (block.below().typeId == "minecraft:grass_block") {
                const place = value * Math.random() < 0.5;
                if (place) {
                    const tall = value * Math.random() < 0.1;
                    const grass = Math.random() < 0.5;
                    if (grass) {
                        block.setType(`minecraft:${tall ? "tall" : "short"}_grass`);
                    } else {
                        const typeId = tall ? randElement(TALL_PLANTS) : randElement(SHORT_PLANTS);
                        block.setType(typeId);
                    }
                }
            }
            break;
        case "minecraft:short_grass":
            block.setType("minecraft:tall_grass");
            break;
        case "minecraft:fern":
            block.setType("minecraft:large_fern");
            break;
        case "minecraft:pitcher_crop":
            block.setPermutation(permutation.withState("growth", 2));
            break;
        case "minecraft:wheat":
        case "minecraft:carrots":
        case "minecraft:potatoes":
        case "minecraft:pumpkin_stem":
        case "minecraft:melon_stem":
        case "minecraft:beetroot":
        case "minecraft:sweet_berry_bush":
        case "minecraft:torchflower_crop":
            block.setPermutation(permutation.withState("growth", 7));
            break;
    }
}

/** @typedef {{min: Number, max: Number}} NumberRange */
/** @typedef {{x: Number, y: Number, z: Number}} Vector3 */

/**
 * @param {Number} x 
 * @param {NumberRange} range 
 */
function withinRange(x, range) {
    return x >= range.min && x <= range.max;
}

/** @param {*[]} array */
function randElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a list of locations bounded by a rectangular prism.
 * @param {Vector3} range The length of each semi-axis.
 * @returns {Vector3[]} A list of locations within a rectangular prism centered about the origin.
 */
function getRectPrism(range) {
    const locations = [];
    for (let x = -range.x; x <= range.x; ++x)
    for (let y = -range.y; y <= range.y; ++y)
    for (let z = -range.z; z <= range.z; ++z)
        locations.push({x: x, y: y, z: z});
    return locations;
}

/**
 * @param {Vector3} range 
 * @param {Vector3} position 
 */
function ellipsoidValue(range, position) {
    const pos2 = mul(position, position);
    const ran2 = mul(range, range);
    return dot(div(pos2, ran2), toVec(1));
}
