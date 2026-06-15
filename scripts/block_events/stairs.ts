import { Direction, system, Vector3, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

function weirdoToVector(weirdoDir: number): Vector3 {
    return [Vec3.East, Vec3.West, Vec3.South, Vec3.North][weirdoDir];
}

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const { player, block, itemStack, isFirstEvent, blockFace } = event;
    if (!block.typeId.includes("stairs")) return;
    if (itemStack || !isFirstEvent) return;

    const states = block.permutation.getAllStates();
    if (states["upside_down_bit"] || states["minecraft:vertical_half"] == "top") return;

    const { dimension } = block, { heightRange } = dimension;

    const above = block.location.y < heightRange.max ? block.above() : undefined;
    if (above && !above.isAir && !above.isLiquid) return;

    const weirdoDir = states["weirdo_direction"], cardDir = states["minecraft:cardinal_direction"];
    const direction = cardDir ? Vec3.fromBlockFace(cardDir) : weirdoToVector(weirdoDir ?? 0);
    if (Vec3.toDirection(direction) == blockFace || blockFace == Direction.Down) return;

    const location = Vec3.below(Vec3.add(block.center(), Vec3.mul(direction, -0.125)), 0.125);
    system.run(() => {
        const seat = dimension.spawnEntity("tcsmp:stair_seat", location);
        seat.setRotation(Vec3.toRotation(Vec3.neg(direction)));
        seat.addRider(player);
    });
});

world.afterEvents.playerBreakBlock.subscribe(event => {
    const { block, dimension, brokenBlockPermutation } = event, { location } = block;
    if (!brokenBlockPermutation.type.id.includes("stairs")) return;
    for (const seat of dimension.getEntities(
        { location, volume: Vec3.One, type: "tcsmp:stair_seat" }
    )) seat.remove();
});
