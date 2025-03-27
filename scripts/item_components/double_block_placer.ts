import { world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const { itemStack, block, blockFace } = event;
    const { dimension, } = block, { heightRange } = dimension;
    if (!itemStack?.hasTag("tcsmp:double_block_placer")) return;

    const target = Vec3.add(block.location, Vec3.fromDirection(blockFace));
    if (target.y == heightRange.max) return event.cancel = true;

    const above = dimension.getBlock(Vec3.above(target));
    event.cancel = !above?.isAir && !above?.isLiquid;
});
