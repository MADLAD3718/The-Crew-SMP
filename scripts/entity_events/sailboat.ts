import { Vec2, Vec3 } from "@madlad3718/mcveclib";
import { Entity, Player, system, world } from "@minecraft/server";
import { clamp, mod } from "../util";

const TURN_ACCEL = 0.575;
const MAX_TURN_RATE = 5.75;

const THROTTLE_ACCEL = 0.0025;
const THROTTLE_DECCEL = 0.0025;
const MAX_THROTTLE = 0.08;

world.afterEvents.playerInteractWithEntity.subscribe(event => {
    const { target: sailboat, player } = event;
    if (!player.isValid || !sailboat.isValid ||
        !sailboat.matches({ type: "tcsmp:sailboat" })) return;
    // This event runs *after* the interaction already took place.
    if (sailboat.getRiders().length > 1) return;

    new SailboatController(sailboat, player).begin();
});

class SailboatController {
    protected turnRate = 0;
    protected throttle = 0;

    constructor(protected boat: Entity, protected player: Player) { }

    public begin() {
        const interval = system.runInterval(() => {
            if (!this.player.isValid || !this.boat.isValid ||
                this.boat.getRiders().length === 0) {
                this.boat.resetProperty("tcsmp:throttle");
                return system.clearRun(interval);
            }
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
