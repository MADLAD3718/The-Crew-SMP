import { EquipmentSlot, system, TicksPerSecond, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

const VELOCITIES: Map<string, number> = new Map();
const RIDING_TIMES: Map<string, number> = new Map();
const RIDDEN_TIME = 0.5 * TicksPerSecond;

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const { dimension, equipment, location } = player;
        const boots = equipment.getEquipment(EquipmentSlot.Feet);
        if (boots?.typeId != "tcsmp:slime_boots" || player.isSneaking) return;

        const lastVelocity = VELOCITIES.get(player.id) ?? 0;
        const thisVelocity = player.getVelocity();

        const lastRidingTime = RIDING_TIMES.get(player.id) ?? 0;
        const wasRiding = system.currentTick - lastRidingTime < RIDDEN_TIME;

        if (player.isOnGround && lastVelocity < -0.5 && !wasRiding) {
            dimension.playSound("land.slime", location, {volume: 0.22});
            player.applyImpulse(Vec3.from(thisVelocity.x, -0.95 * lastVelocity, thisVelocity.z));
        }

        VELOCITIES.set(player.id, thisVelocity.y);
        if (player.entityRidingOn)
            RIDING_TIMES.set(player.id, system.currentTick);
    }
});
