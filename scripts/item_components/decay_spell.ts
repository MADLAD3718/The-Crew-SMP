import { Block, Dimension, ItemCustomComponent, system, Vector3 } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { Vec3 } from "@madlad3718/mcveclib";

import { ellipsoidValue, getRectPrism, within } from "../util";

const DECAY_RANGE = Vec3.from(15, 7, 15);
const DECAY_VOLUME = getRectPrism(DECAY_RANGE).filter(u => {
    return ellipsoidValue(DECAY_RANGE, u) <= 1;
}).sort((u, v) => {
    return Vec3.dot(u, u) - Vec3.dot(v, v);
});

const decaySpellComponent: ItemCustomComponent = {
    onUse(event) { 
        const { source } = event, { location, dimension } = source;
        system.runJob(decay(location, dimension));
    }
}

function* decay(location: Vector3, dimension: Dimension): Generator<void, void, void> {
    for (const offset of DECAY_VOLUME) {
        const value = ellipsoidValue(DECAY_RANGE, offset);

        const target = Vec3.add(location, offset);
        if (!within(target.y, dimension.heightRange)) continue;

        const block = dimension.getBlock(target);
        if (block) applyDecay(block, value);

        yield;
    }
}

export default decaySpellComponent;

function applyDecay(block: Block, value: number) {
    const {dimension, permutation} = block, {heightRange} = dimension;
    const rand = Math.random();

    const coarse = value * rand < 0.08;
    const deadbush = rand < 0.25;

    const deadbushId = MinecraftBlockTypes.Deadbush;
    const coarseDirtId = MinecraftBlockTypes.CoarseDirt;
    const airId = MinecraftBlockTypes.Air;
    const dirtId = MinecraftBlockTypes.Dirt;

    switch (block.typeId) {
        case MinecraftBlockTypes.Dirt:
        case MinecraftBlockTypes.GrassBlock:
            block.setType(coarse ? coarseDirtId : dirtId);
            if (block.y == heightRange.max) break;

            const above = block.above();
            if (!deadbush || !above?.matches(airId)) break;

            above.setType(deadbushId);
            break;
        case MinecraftBlockTypes.ShortGrass:
        case MinecraftBlockTypes.Fern:
        case MinecraftBlockTypes.Dandelion:
        case MinecraftBlockTypes.Poppy:
        case MinecraftBlockTypes.BlueOrchid:
        case MinecraftBlockTypes.Allium:
        case MinecraftBlockTypes.AzureBluet:
        case MinecraftBlockTypes.RedTulip:
        case MinecraftBlockTypes.OrangeTulip:
        case MinecraftBlockTypes.WhiteTulip:
        case MinecraftBlockTypes.PinkTulip:
        case MinecraftBlockTypes.OxeyeDaisy:
        case MinecraftBlockTypes.Cornflower:
        case MinecraftBlockTypes.LilyOfTheValley:
            const typeId = deadbush ? deadbushId : airId;
            block.setType(typeId);
            break;
        case MinecraftBlockTypes.LargeFern:
        case MinecraftBlockTypes.Lilac:
        case MinecraftBlockTypes.RoseBush:
        case MinecraftBlockTypes.Peony:
            const top_double_plant = permutation.getState("upper_block_bit");
            const replace_double_plant = top_double_plant ? block.below() : block;
            replace_double_plant?.setType(airId);
            break;
        case MinecraftBlockTypes.TallGrass:
            const top_grass = permutation.getState("upper_block_bit");
            const replace_grass = top_grass ? block : block.above();
            replace_grass?.setType(airId);
            block.setType(airId);
            break;
        case MinecraftBlockTypes.PitcherCrop:
        case MinecraftBlockTypes.Wheat:
        case MinecraftBlockTypes.Carrots:
        case MinecraftBlockTypes.Potatoes:
        case MinecraftBlockTypes.PumpkinStem:
        case MinecraftBlockTypes.MelonStem:
        case MinecraftBlockTypes.Beetroot:
        case MinecraftBlockTypes.SweetBerryBush:
        case MinecraftBlockTypes.TorchflowerCrop:
            block.setType(airId);
            break;
        case MinecraftBlockTypes.Farmland:
            block.setPermutation(permutation.withState("moisturized_amount", 0));
            break;
    }
}
