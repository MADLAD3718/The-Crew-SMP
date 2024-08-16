import { Block, ItemComponentUseEvent, MolangVariableMap } from "@minecraft/server";
import { ellipsoidValue, getRectPrism, withinRange } from "../common";
import { add } from "../extensions/vectors";

const DECAY_RANGE = {x: 15, y: 7, z: 15};

/** @type {import("@minecraft/server").ItemCustomComponent} */
export const decaySpellComponent = {
    onUse: useDecaySpell
}

/** @param {ItemComponentUseEvent} event  */
function useDecaySpell(event) {
    const {source} = event, {dimension, location} = source;
    source.stopSound("random.bow");
    const head = source.getHeadLocation();
    const soundOptions = {pitch: 0.95 + 0.1 * Math.random()};
    dimension.playSound("scroll.cast", head, soundOptions);

    const vars = new MolangVariableMap();
    vars.setColorRGB("colour", {red: 0.8, green: 0.7, blue: 0.6});
    dimension.spawnParticle("tcsmp:spell_cast", head, vars);

    for (const offset of getRectPrism(DECAY_RANGE)) {
        const value = ellipsoidValue(DECAY_RANGE, offset);
        if (value > 1) continue;

        const target = add(location, offset);
        if (!withinRange(target.y, dimension.heightRange)) continue;

        const block = dimension.getBlock(target);
        applyDecay(block, value);
    }
}

/**
 * @param {Block} block 
 * @param {Number} value 
 */
function applyDecay(block, value) {
    const {dimension, permutation} = block, {heightRange} = dimension;
    const rand = Math.random();

    const coarse = value * rand < 0.08;
    const deadbush = rand < 0.25;

    switch (block.typeId) {
        case "minecraft:dirt":
        case "minecraft:grass_block":
            block.setType(`minecraft:${coarse ? "coarse_" : ""}dirt`);
            if (block.y == heightRange.max) break;
            const above = block.above();
            if (!deadbush || above.typeId !== "minecraft:air") break;
            above.setType("minecraft:deadbush");
            break;
        case "minecraft:short_grass":
        case "minecraft:fern":
        case "minecraft:dandelion":
        case "minecraft:poppy":
        case "minecraft:blue_orchid":
        case "minecraft:allium":
        case "minecraft:azure_bluet":
        case "minecraft:red_tulip":
        case "minecraft:orange_tulip":
        case "minecraft:white_tulip":
        case "minecraft:pink_tulip":
        case "minecraft:oxeye_daisy":
        case "minecraft:cornflower":
        case "minecraft:lily_of_the_valley":
            const typeId = deadbush ? "minecraft:deadbush" : "minecraft:air";
            block.setType(typeId);
            break;
        case "minecraft:large_fern":
        case "minecraft:lilac":
        case "minecraft:rose_bush":
        case "minecraft:peony":
            const top_double_plant = permutation.getState("upper_block_bit");
            const replace_double_plant = top_double_plant ? block.below() : block;
            replace_double_plant.setType("minecraft:air");
            break;
        case "minecraft:tall_grass":
            const top_grass = permutation.getState("upper_block_bit");
            const replace_grass = top_grass ? block : block.above();
            replace_grass.setType("minecraft:air");
            block.setType("minecraft:air");
            break;
        case "minecraft:pitcher_crop":
        case "minecraft:wheat":
        case "minecraft:carrots":
        case "minecraft:potatoes":
        case "minecraft:pumpkin_stem":
        case "minecraft:melon_stem":
        case "minecraft:beetroot":
        case "minecraft:sweet_berry_bush":
        case "minecraft:torchflower_crop":
            block.setType("minecraft:air");
            break;
        case "minecraft:farmland":
            block.setPermutation(permutation.withState("moisturized_amount", 0));
            break;
    }
}
