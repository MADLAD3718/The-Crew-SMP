import { Block, GameMode, ItemComponentUseEvent, MolangVariableMap } from "@minecraft/server";
import { add, div, dot, mul, sub, toVec } from "../extensions/vectors";
import { decrementSlot, isWater, randElement, withinRange } from "../common";

const GROWTH_RANGE = {x: 15, y: 5, z: 15};
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
const WATER_PLANTS = [
    "minecraft:seagrass",
    "minecraft:sea_pickle",
    "minecraft:fire_coral",
    "minecraft:fire_coral_fan",
    "minecraft:brain_coral",
    "minecraft:brain_coral_fan",
    "minecraft:bubble_coral",
    "minecraft:bubble_coral_fan",
    "minecraft:tube_coral",
    "minecraft:tube_coral_fan",
    "minecraft:horn_coral",
    "minecraft:horn_coral_fan",
]

/** @type {import("@minecraft/server").ItemCustomComponent} */
export const growthSpellComponent = {
    onUse: useGrowthSpell
}

/** @param {ItemComponentUseEvent} event  */
function useGrowthSpell(event) {
    const {source} = event, {dimension, location} = source;
    const head = source.getHeadLocation();
    dimension.playSound("scroll.cast", head);

    const vars = new MolangVariableMap();
    vars.setColorRGB("colour", {red: 0.8, green: 1.0, blue: 0.8});
    dimension.spawnParticle("tcsmp:spell_cast", head, vars);

    if (source.getGameMode() !== GameMode.creative)
        decrementSlot(source.inventory.container, source.selectedSlotIndex);
    
    for (const offset of getRectPrism(GROWTH_RANGE)) {
        const value = ellipsoidValue(GROWTH_RANGE, offset);
        if (value > 1) continue;

        const target = add(location, offset);
        if (!withinRange(target.y, dimension.heightRange)) continue;

        const block = dimension.getBlock(target);
        applyGrowth(block, value);
    }
}

/**
 * @param {Block} block 
 * @param {Number} value 
 */
function applyGrowth(block, value) {
    const {dimension, permutation} = block, {heightRange} = dimension;
    const rand = Math.random();

    const place = value * rand < 0.5;
    const tall = value * rand < 0.08 && block.y < heightRange.max;
    const variant = rand < 0.5;

    if (rand < 0.015)
        dimension.spawnParticle("minecraft:crop_growth_area_emitter", block.center());
    switch (block.typeId) {
        case "minecraft:dirt":
            if (block.y !== heightRange.max && block.above().typeId !== "minecraft:air") break;
            block.setType("minecraft:grass_block");
            break;
        case "minecraft:air":
            if (!place) break;
            if (block.y == heightRange.min) break;
            if (block.below().typeId !== "minecraft:grass_block") break;

            if (variant) {
                const typeId = tall ? randElement(TALL_PLANTS) : randElement(SHORT_PLANTS);
                block.setType(typeId);
            } else block.setType(`minecraft:${tall ? "tall" : "short"}_grass`);

            break;
        case "minecraft:water":
        case "minecraft:flowing_water":
            if (!place) break;
            if (block.y == heightRange.min) break;
            const below = block.below();
            if (below.typeId !== "minecraft:gravel" && below.typeId !== "minecraft:sand") break;


            if (tall) {
                block.setType("minecraft:seagrass");
                const above = block.above();
                if (isWater(above)) {
                    block.setPermutation(block.permutation.withState("sea_grass_type", "double_bot"));
                    above.setPermutation(block.permutation.withState("sea_grass_type", "double_top"));
                }
            } else block.setType(variant ? randElement(WATER_PLANTS) : "minecraft:seagrass");

            break;
        case "minecraft:short_grass":
            dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
            block.setType("minecraft:tall_grass");
            break;
        case "minecraft:fern":
            dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
            block.setType("minecraft:large_fern");
            break;
        case "minecraft:pitcher_crop":
            dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
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
            dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
            block.setPermutation(permutation.withState("growth", 7));
            break;
    }
}

/** @typedef {{x: Number, y: Number, z: Number}} Vector3 */

/**
 * Generates a list of locations bounded by a rectangular prism.
 * @param {Vector3} range The length of each semi-axis.
 * @returns {Vector3[]} A list of locations within a rectangular prism centered about the origin.
 */
function getRectPrism(range) {
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
function ellipsoidValue(range, position) {
    const pos2 = mul(position, position);
    const ran2 = mul(range, range);
    const quo = div(pos2, ran2);
    return quo.x + quo.y + quo.z;
}
