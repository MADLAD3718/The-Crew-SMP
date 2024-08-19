import { TicksPerSecond, world } from "@minecraft/server";
import { mul, normalize, reject, Unit } from "../extensions/vectors";
import "../extensions/entities";

const USE_TIME = TicksPerSecond * 1.0;
const MAX_DURATION = TicksPerSecond * 500;
const DASH_LENGTH = TicksPerSecond * 5.0;
const DASH_TIME = TicksPerSecond * 1.0;

const AIR_DRAG = 0.02;

world.afterEvents.itemReleaseUse.subscribe(event => {
    const {itemStack, useDuration, source: player} = event;
    if (itemStack.typeId !== "tcsmp:katana") return;
    if (MAX_DURATION - useDuration <= USE_TIME) return;

    const grounded = player.isOnGround;
    const friction = grounded ? 0.4 : 0;
    const conservance = (1 - AIR_DRAG) * (1 - friction);
    console.warn(`conservance: ${conservance}`);
    const speed = DASH_LENGTH / (1 + (1 - Math.pow(conservance, DASH_TIME + 1)) / (1 - conservance));
    console.warn(`speed: ${speed}`);
    const direction = normalize(reject(player.getViewDirection(), Unit.Up));
    player.applyImpulse(mul(direction, speed));
});
