import { Block, system, TicksPerSecond, world } from "@minecraft/server";
import { distance, mul, normalize, reject, Unit } from "../extensions/vectors";
import "../extensions/entities";

const USE_TIME = TicksPerSecond * 1.0;
const MAX_DURATION = TicksPerSecond * 500;
const DASH_DISTANCE = 100.0;

world.afterEvents.itemReleaseUse.subscribe(event => {
    const {itemStack, useDuration, source: player} = event;
    if (itemStack.typeId !== "tcsmp:katana") return;
    if (MAX_DURATION - useDuration <= USE_TIME) return;
    if (!player.isOnGround) return;

    const drag = 0.01;
    const friction = getFriction(player.getBlockStandingOn());
    const thrust = 1 - drag;
    const slipperiness = 1 - friction;

    const retainment = thrust * slipperiness;
    const final_speed = 0.01;
    const initial_speed = (final_speed - DASH_DISTANCE * (retainment - 1)) / (1 + (retainment - 1) * 1.588987612);
    const predicted_time = Math.log(final_speed / initial_speed) / Math.log(retainment) - 1;
    
    const origin = player.location;

    const direction = normalize(reject(player.getViewDirection(), Unit.Up));
    player.applyImpulse(mul(direction, initial_speed));

    system.runTimeout(() => {
        let message = `Statistics:`;
        message += `\nPredicted Displacement: ${DASH_DISTANCE} blocks`;
        message += `\nActual Displacement: ${distance(player.location, origin)} blocks`;
        console.warn(message);
    }, predicted_time);
});

/** @param {Block} block  */
function getFriction(block) {
    switch (block.typeId) {
        case "minecraft:air": return 0.0;
        case "minecraft:ice": return 0.02;
        case "minecraft:slime": return 0.2;
        default: return 0.4;
    }
}
