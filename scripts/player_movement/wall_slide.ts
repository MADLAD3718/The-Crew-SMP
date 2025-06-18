import { GameMode, Player, system, TicksPerSecond, world } from "@minecraft/server";
import { Mat3, Vec2, Vec3 } from "@madlad3718/mcveclib";

const SLIDE_TIMER: Map<string, number> = new Map();
const MAX_SLIDE_TIME = 0.25 * TicksPerSecond;

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (!isSliding(player)) {
            SLIDE_TIMER.set(player.id, system.currentTick);
            continue;
        }

        const slideStartTime = SLIDE_TIMER.get(player.id) ?? system.currentTick;
        if (system.currentTick - slideStartTime > MAX_SLIDE_TIME) continue;

        player.applyImpulse(Vec3.mul(Vec3.Up, 0.01));
    }
});

function isSliding(player: Player): boolean {
    const { dimension, location, inputInfo } = player;
    if (player.getGameMode() == GameMode.Creative) return false;
    if (!player.isFalling || !player.isSneaking || player.isSwimming) return false;

    const movement = inputInfo.getMovementVector();
    if (Vec2.equal(movement, Vec2.Zero)) return false;
    
    const view = player.getViewDirection();
    const viewXZ = Vec3.normalize(Vec3.from(view.x, 0, view.z));
    const viewMatrix = Mat3.buildTNB(viewXZ);
    const inputPlayerSpace = Vec3.from(movement.x, movement.y, 0);
    const inputWorldSpace = Mat3.mul(viewMatrix, inputPlayerSpace);
    const cardinal = Vec3.fromDirection(Vec3.toDirection(inputWorldSpace));

    const raycast = dimension.getBlockFromRay(
        location, cardinal,
        { includeLiquidBlocks: false, includePassableBlocks: false }
    );
    if (!raycast) return false;

    const hitpos = Vec3.add(raycast.block, raycast.faceLocation);
    const distance = Vec3.distance(location, hitpos);
    if (distance > 0.31) return false;

    const normal = Vec3.fromDirection(raycast.face);
    if (-Vec3.dot(viewXZ, normal) < 0.5)
        return false;
    else return true;
}
