import { BlockRaycastHit, ButtonState, Direction, GameMode, InputButton, Player, Vector3, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

world.afterEvents.playerButtonInput.subscribe(event => {
    const { player, button, newButtonState } = event, { dimension, location } = player;
    if (player.getGameMode() == GameMode.Creative) return;
    if (button != InputButton.Jump || newButtonState != ButtonState.Pressed) return;
    if (!player.isSneaking || getHeightFromSurface(player) < 0.33) return;

    const wall = getClosestWall(player);
    if (!wall) return;

    const distance = Vec3.distance(location, Vec3.add(wall.block, wall.faceLocation));
    console.warn(Vec3.toString(wall.faceLocation));
    console.warn(`Distance: ${distance}m.`);
    dimension.spawnParticle("minecraft:candle_flame_particle", Vec3.add(wall.block, wall.faceLocation));
    if (distance > 0.31) return;

    const view = player.getViewDirection();
    const viewXZ = Vec3.normalize(Vec3.from(view.x, 0, view.z));
    const normal = Vec3.fromDirection(wall.face);
    if (-Vec3.dot(viewXZ, normal) < 0.5) return;

    const jumpdir = Vec3.normalize(Vec3.above(normal));
    player.applyImpulse(Vec3.mul(jumpdir, 0.8));

    dimension.playSound(
        "player.wall_jump", location,
        {pitch: 0.9 + 0.2 * Math.random()}
    );
    dimension.spawnParticle("tcsmp:wall_jump", location);
});

function getHeightFromSurface(player: Player): number {
    const { dimension, location } = player;
    const raycast = dimension.getBlockFromRay(
        location, Vec3.Down,
        { includeLiquidBlocks: true, includePassableBlocks: false }
    );
    if (!raycast) return Infinity;

    const offset = Vec3.saturate(Vec3.fromDirection(raycast.face));
    const surface = Vec3.add(raycast.block, raycast.faceLocation, offset);
    return Vec3.distance(location, surface);
}

function getClosestWall(player: Player): BlockRaycastHit | undefined {
    const { dimension, location } = player;
    const cardinals: Vector3[] = [Vec3.North, Vec3.East, Vec3.South, Vec3.West];
    const candidates: BlockRaycastHit[] = [];
    for (const direction of cardinals) {
        const raycast = dimension.getBlockFromRay(
            location, direction,
            { includeLiquidBlocks: false,
                includePassableBlocks: false }
        );
        if (raycast) candidates.push(correctFaceLocation(raycast));
    }

    if (!candidates.length) return undefined;
    return candidates.reduce((current, next) => {
        const curDist = Vec3.distance(location, Vec3.add(current.block, current.faceLocation));
        const nextDist = Vec3.distance(location, Vec3.add(next.block, next.faceLocation));
        return nextDist < curDist ? next : current;
    });
}

function correctFaceLocation(raycast: BlockRaycastHit): BlockRaycastHit {
    const offset = Vec3.saturate(Vec3.fromDirection(raycast.face));
    raycast.faceLocation = Vec3.add(raycast.faceLocation, offset);
    return raycast;
}
