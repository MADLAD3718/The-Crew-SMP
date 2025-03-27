import { Block, Dimension, ItemCustomComponent, system, Vector3 } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { Vec3 } from "@madlad3718/mcveclib";
import { ellipsoidValue, getRectPrism, randElement, within } from "../util";

const GROWTH_RANGE = Vec3.from(15, 7, 15);
const GROWTH_VOLUME = getRectPrism(GROWTH_RANGE).filter(u => {
    return ellipsoidValue(GROWTH_RANGE, u) <= 1;
}).sort((u, v) => { // Merge sort actually performed worse than Array.prototype.sort() in this case
    return Vec3.dot(u, u) - Vec3.dot(v, v);
});
const SHORT_PLANTS: string[] = [
    MinecraftBlockTypes.ShortGrass,
    MinecraftBlockTypes.Fern,
    MinecraftBlockTypes.Dandelion,
    MinecraftBlockTypes.Poppy,
    MinecraftBlockTypes.BlueOrchid,
    MinecraftBlockTypes.Allium,
    MinecraftBlockTypes.AzureBluet,
    MinecraftBlockTypes.RedTulip,
    MinecraftBlockTypes.OrangeTulip,
    MinecraftBlockTypes.WhiteTulip,
    MinecraftBlockTypes.PinkTulip,
    MinecraftBlockTypes.OxeyeDaisy,
    MinecraftBlockTypes.Cornflower,
    MinecraftBlockTypes.LilyOfTheValley
]
const TALL_PLANTS: string[] = [
    MinecraftBlockTypes.TallGrass,
    MinecraftBlockTypes.LargeFern,
    MinecraftBlockTypes.Lilac,
    MinecraftBlockTypes.RoseBush,
    MinecraftBlockTypes.Peony
]
const WATER_PLANTS: string[] = [
    MinecraftBlockTypes.Seagrass,
    MinecraftBlockTypes.SeaPickle,
    MinecraftBlockTypes.FireCoral,
    MinecraftBlockTypes.FireCoralFan,
    MinecraftBlockTypes.BrainCoral,
    MinecraftBlockTypes.BrainCoralFan,
    MinecraftBlockTypes.BubbleCoral,
    MinecraftBlockTypes.BubbleCoralFan,
    MinecraftBlockTypes.TubeCoral,
    MinecraftBlockTypes.TubeCoralFan,
    MinecraftBlockTypes.HornCoral,
    MinecraftBlockTypes.HornCoralFan,
]

const growthSpellComponent: ItemCustomComponent = {
    onUse(event) {
        const { source } = event, { location, dimension } = source;
        system.runJob(growth(location, dimension));
    }
}

function* growth(location: Vector3, dimension: Dimension): Generator<void, void, void> {
    for (const offset of GROWTH_VOLUME) {
        const value = ellipsoidValue(GROWTH_RANGE, offset);

        const target = Vec3.add(location, offset);
        if (!within(target.y, dimension.heightRange)) continue;

        const block = dimension.getBlock(target);
        if (block) applyGrowth(block, value);

        yield;
    }
}

export default growthSpellComponent;

function applyGrowth(block: Block, value: number) {
    const {dimension, permutation} = block, {heightRange} = dimension;
    const rand = Math.random();

    const place = value * rand < 0.5;
    const tall = value * rand < 0.08 && block.y < heightRange.max;
    const variant = rand < 0.5;

    if (rand < 0.015)
        dimension.spawnParticle("minecraft:crop_growth_area_emitter", block.center());
    switch (block.typeId) {
        case MinecraftBlockTypes.Dirt:
            if (block.y == heightRange.max) break;
            
            const above = block.above(), is_deadbush = above?.matches(MinecraftBlockTypes.Deadbush);
            if (!above?.matches(MinecraftBlockTypes.Air) && !is_deadbush) break;

            block.setType(MinecraftBlockTypes.GrassBlock);
            if (is_deadbush) above?.setType(MinecraftBlockTypes.ShortGrass);
            break;
        case MinecraftBlockTypes.CoarseDirt:
            block.setType(MinecraftBlockTypes.Dirt);
            if (block.y == heightRange.max) break;

            if (block.above()?.matches(MinecraftBlockTypes.Deadbush))
                block.above()?.setType(MinecraftBlockTypes.Air);
            break;
        case MinecraftBlockTypes.Air:
            if (!place) break;
            if (block.y == heightRange.min) break;
            if (!block.below()?.matches(MinecraftBlockTypes.GrassBlock)) break;

            if (variant) {
                const typeId = tall ? randElement(TALL_PLANTS) : randElement(SHORT_PLANTS);
                block.setType(typeId);
            } else block.setType(tall ? MinecraftBlockTypes.TallGrass : MinecraftBlockTypes.ShortGrass);

            break;
        case MinecraftBlockTypes.Water:
        case MinecraftBlockTypes.FlowingWater:
            if (!place) break;
            if (block.y == heightRange.min) break;

            const below = block.below();
            if (!below?.matches(MinecraftBlockTypes.Gravel) && !below?.matches(MinecraftBlockTypes.Sand)) break;

            if (tall) {
                block.setType(MinecraftBlockTypes.Seagrass);
                const above = block.above();
                if (above?.isLiquid) {
                    block.setPermutation(block.permutation.withState("sea_grass_type", "double_bot"));
                    above.setPermutation(block.permutation.withState("sea_grass_type", "double_top"));
                }
            } else block.setType(variant ? randElement(WATER_PLANTS) : MinecraftBlockTypes.Seagrass);

            break;
        case MinecraftBlockTypes.Fern:
            if (block.location.y == heightRange.max) break;
            if (!block.above()?.matches(MinecraftBlockTypes.Air)) break;

            dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
            block.setType(MinecraftBlockTypes.LargeFern);
            break;
        case MinecraftBlockTypes.PitcherCrop:
            dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
            block.setPermutation(permutation.withState("growth", 2));
            break;
        case MinecraftBlockTypes.Wheat:
        case MinecraftBlockTypes.Carrots:
        case MinecraftBlockTypes.Potatoes:
        case MinecraftBlockTypes.PumpkinStem:
        case MinecraftBlockTypes.MelonStem:
        case MinecraftBlockTypes.Beetroot:
        case MinecraftBlockTypes.SweetBerryBush:
        case MinecraftBlockTypes.TorchflowerCrop:
            dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
            block.setPermutation(permutation.withState("growth", 7));
            break;
        case "tcsmp:cannabis_plant":
            dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
            block.setPermutation(permutation.withState("tcsmp:growth", 7));
            break;
    }
}
