import { Direction, system, Vector3, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

const SittingBlocks: Set<string> = new Set();

function weirdoToVector(weirdoDir: number): Vector3 {
    return [Vec3.East, Vec3.West, Vec3.South, Vec3.North][weirdoDir];
}

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const { player, block, itemStack, isFirstEvent, blockFace } = event;
    if (block.location.y - player.location.y > 0.5) return;
    if (!block.typeId.endsWith("stairs")) return;
    if (itemStack || !isFirstEvent) return;

    const { dimension } = block, { heightRange } = dimension;
    if (SittingBlocks.has(JSON.stringify({ dimension, ...block.location })))
        return;

    const bottomCenter = block.bottomCenter();
    if (Vec3.distance(
        Vec3.from(player.location.x, 0, player.location.z),
        Vec3.from(bottomCenter.x, 0, bottomCenter.z)
    ) >= 1.5) return;

    const states = block.permutation.getAllStates();
    if (states["upside_down_bit"] || states["minecraft:vertical_half"] == "top")
        return;

    const above = block.location.y < heightRange.max ? block.above() : undefined;
    if (above && !above.isAir && !above.isLiquid) return;

    const weirdoDir = states["weirdo_direction"], cardDir = states["minecraft:cardinal_direction"];
    const direction = cardDir ? Vec3.fromBlockFace(cardDir) : weirdoToVector(weirdoDir ?? 0);
    if (Vec3.toDirection(direction) == blockFace || blockFace == Direction.Down)
        return;

    const location = Vec3.below(Vec3.add(block.center(), Vec3.mul(direction, -0.125)), 0.125);
    system.run(() => {
        const seat = dimension.spawnEntity("tcsmp:stair_seat", location);
        seat.setRotation(Vec3.toRotation(Vec3.neg(direction)));
        seat.addRider(player);
    });
    SittingBlocks.add(JSON.stringify({ dimension, ...block.location }));
});

world.afterEvents.playerBreakBlock.subscribe(event => {
    const { block, dimension, brokenBlockPermutation } = event, { location } = block;
    if (!brokenBlockPermutation.type.id.includes("stairs")) return;
    for (const seat of dimension.getEntities(
        { location, volume: Vec3.One, type: "tcsmp:stair_seat" }
    )) seat.remove();
});

world.beforeEvents.entityRemove.subscribe(({ removedEntity }) => {
    if (removedEntity.typeId !== "tcsmp:stair_seat") return;
    const { dimension, location } = removedEntity;
    const blockLocation = Vec3.floor(location);
    SittingBlocks.delete(JSON.stringify({ dimension, ...blockLocation }));
});
