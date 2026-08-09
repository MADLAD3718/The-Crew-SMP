import { Mat3, Vec2, Vec3 } from "@madlad3718/mcveclib";
import { Entity, Player, system, world } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { intersect, Plane3, Ray3, viewMatrix } from "../math";
import { clamp, mod } from "../util";

const TURN_ACCEL = 0.575;
const MAX_TURN_RATE = 5.75;

const THROTTLE_ACCEL = 0.0025;
const THROTTLE_DECCEL = 0.0025;
const MAX_THROTTLE = 0.08;

world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    const { target: sailboat, player, itemStack } = event;
    if (!player.isValid || !sailboat.isValid ||
        !sailboat.matches({ type: "tcsmp:sailboat" })) return;

    if (itemStack) {
        const sailboatMatrix = viewMatrix(sailboat.getViewDirection());
        const invSailboatMatrix = Mat3.inverse(sailboatMatrix);

        const rayOrigin = Vec3.sub(
            player.getHeadLocation(),
            Vec3.above(sailboat.location, 0.1875)
        );
        const rayDirection = Mat3.mul(invSailboatMatrix, player.getViewDirection());

        const ray: Ray3 = { origin: rayOrigin, direction: rayDirection };
        const plane: Plane3 = { origin: Vec3.Zero, normal: Vec3.Up };

        const intersection = intersect(ray, plane);
        if (!intersection) return;

        // Maps different quadrants of the intersection plane to {0, 1, 2, 3}
        const quadrant = +(intersection.z < 0) << 1 | +(intersection.x < 0);
        console.warn(`The quadrant was computed as ${quadrant}`);

        event.cancel = true;
    }
});

world.afterEvents.playerInteractWithEntity.subscribe(event => {
    const { target: sailboat, player, itemStack } = event;
    if (!player.isValid || !sailboat.isValid ||
        !sailboat.matches({ type: "tcsmp:sailboat" })) return;

    // The player has attempted to ride
    if (!itemStack) {
        // This event runs *after* the interaction already took place.
        if (sailboat.getRiders()[0].id !== player.id) return;

        new SailboatController(sailboat, player).begin();
    }

});

class SailboatController {
    protected turnRate = 0;
    protected throttle = 0;

    constructor(protected boat: Entity, protected player: Player) { }

    public begin() {
        const interval = system.runInterval(() => {
            const captain = this.boat.getRiders()[0];
            if (!captain?.isValid || !this.boat.isValid ||
                !captain.matches({ type: MinecraftEntityTypes.Player })) {
                this.boat.resetProperty("tcsmp:throttle");
                return system.clearRun(interval);
            }
            if (captain.id !== this.player.id)
                this.player = captain as Player;
            system.runJob(this.sailboatControl());
        });
    }

    protected * sailboatControl(): Generator<void, void, void> {
        const input = this.player.inputInfo.getMovementVector();

        if (input.x !== 0.0)
            this.turnRate = clamp(this.turnRate - TURN_ACCEL * Math.round(input.x), -MAX_TURN_RATE, MAX_TURN_RATE);
        else if (this.turnRate !== 0)
            this.turnRate = Math.sign(this.turnRate) * Math.max(Math.abs(this.turnRate) - TURN_ACCEL, 0);

        if (this.turnRate !== 0) {
            const rotation = this.boat.getRotation();
            const nextYRotation = mod(rotation.y + 180.0 + this.turnRate, 360.0) - 180.0;

            this.boat.setRotation(Vec2.from(rotation.x, nextYRotation));
            this.boat.applyImpulse(Vec3.mul(this.boat.getViewDirection(), 2 ** -8));
        }

        if (input.y !== 0.0) {
            const throttleAcceleration = input.y >= 0 ? THROTTLE_ACCEL : THROTTLE_DECCEL;
            this.throttle = clamp(this.throttle + Math.round(input.y) * throttleAcceleration, 0.0, MAX_THROTTLE);
            this.boat.setProperty("tcsmp:throttle", this.throttle / MAX_THROTTLE);
        }

        this.boat.applyImpulse(Vec3.mul(this.boat.getViewDirection(), this.throttle));

        yield;
    }
}
