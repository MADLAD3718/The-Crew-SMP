import { BlockRaycastHit, ButtonState, GameMode, InputButton, Player, Vector3, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

const JUMP_COUNTS: Map<string, number> = new Map();

world.afterEvents.playerButtonInput.subscribe(event => {
    const { player, button, newButtonState } = event, { dimension, location } = player;
    if (!dimension.getBlock(Vec3.below(location, 0.5))?.isAir)
        return JUMP_COUNTS.set(player.id, 0);
    if (button != InputButton.Jump || newButtonState != ButtonState.Pressed) return;
    if (player.getGameMode() == GameMode.creative) return;

    const wall = getClosestWall(player);
    if (!wall) return;

    const distance = Vec3.distance(location, Vec3.add(wall.block, wall.faceLocation));
    if (distance > 0.31) return;

    const view = player.getViewDirection();
    const normal = Vec3.fromDirection(wall.face);
    if (Vec3.dot(view, normal) >= 0) return;

    const jumps = JUMP_COUNTS.get(player.id) ?? 0;

    const jumpdir = Vec3.normalize(Vec3.above(normal));
    player.applyImpulse(Vec3.mul(jumpdir, 0.8));

    dimension.playSound(
        "player.wall_jump", location,
        {pitch: 1.0 + 0.1 * jumps}
    );

    JUMP_COUNTS.set(player.id, jumps + 1);
});

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
        if (raycast) candidates.push(raycast);
    }

    if (!candidates.length) return undefined;
    return candidates.reduce((current, next) => {
        const curDist = Vec3.distance(location, Vec3.add(current.block, current.faceLocation));
        const nextDist = Vec3.distance(location, Vec3.add(next.block, next.faceLocation));
        return nextDist < curDist ? next : current;
    });
}
