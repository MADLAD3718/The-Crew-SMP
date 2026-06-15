import { EquipmentSlot, system, TicksPerSecond, world } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { Vec3 } from "@madlad3718/mcveclib";

const Velocities: Record<string, number> = {};
const LastRidingTimes: Record<string, number> = {};
const RIDING_DELAY = 0.5 * TicksPerSecond;

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const { dimension, equipment, location } = player;

        const lastVelocity = Velocities[player.id] ?? 0;
        const thisVelocity = player.getVelocity();

        const lastRidingTime = LastRidingTimes[player.id] ?? 0;
        const wasRiding = system.currentTick - lastRidingTime < RIDING_DELAY;
        const below_block = player.getBlockStandingOn();

        if (!player.isSneaking && player.isOnGround && !player.isInWater
            && lastVelocity < -0.375 && !wasRiding && 
            !below_block?.matches(MinecraftBlockTypes.Slime)
        ) {
            const boots = equipment.getEquipment(EquipmentSlot.Feet);
            if (boots?.typeId == "tcsmp:slime_boots") {
                dimension.playSound("land.slime", location, {volume: 0.22});
                player.applyImpulse(Vec3.from(0, -0.95 * lastVelocity, 0));
            }
        }

        Velocities[player.id] = thisVelocity.y;
        if (player.entityRidingOn)
            LastRidingTimes[player.id] = system.currentTick;
    }
});
