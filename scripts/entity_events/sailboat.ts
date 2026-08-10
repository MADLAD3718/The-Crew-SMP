import { Mat3, Vec2, Vec3 } from "@madlad3718/mcveclib";
import { DimensionTypes, Entity, EntityComponentTypes, GameMode, ItemStack, Player, system, world } from "@minecraft/server";
import { MinecraftBlockTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { intersect, Plane3, Ray3, viewMatrix } from "../math";
import { clamp, mod, withoutNamespace } from "../util";

const TURN_ACCEL = 0.575;
const MAX_TURN_RATE = 5.75;

const THROTTLE_ACCEL = 0.0025;
const THROTTLE_DECCEL = 0.0025;
const MAX_THROTTLE = 0.08;

const ValidSlotItems = [
    MinecraftBlockTypes.Chest
];

const ItemSounds: Record<string, string> = {
    "minecraft:chest": "dig.wood"
};

const SlotDrops: Record<string, string> = {
    "chest": "minecraft:chest"
};

world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    const { target: sailboat, player, itemStack } = event;
    if (!player.isValid || !sailboat.isValid || !itemStack ||
        !sailboat.matches({ families: ["sailboat"] })) return;

    const isAxe = itemStack.hasTag("minecraft:is_axe");
    const isSlotItem = ValidSlotItems.some(value => itemStack.typeId === value);

    if (isAxe || isSlotItem) {
        const sailboatView = sailboat.getViewDirection();
        const sailboatMatrix = viewMatrix(sailboatView);
        const invSailboatMatrix = Mat3.inverse(sailboatMatrix);

        const slotCenter = Vec3.add(
            Vec3.above(sailboat.location, 0.1875),
            Vec3.mul(sailboatView, 0.5)
        );

        const rayOrigin = Vec3.sub(player.getHeadLocation(), slotCenter);
        const rayDirection = Mat3.mul(invSailboatMatrix, player.getViewDirection());

        const ray: Ray3 = { origin: rayOrigin, direction: rayDirection };
        const plane: Plane3 = { origin: Vec3.Zero, normal: Vec3.Up };

        const intersection = intersect(ray, plane);
        if (!intersection) return;

        // Maps different quadrants of the intersection plane to {0, 1, 2, 3}
        const quadrant = +(intersection.z < 0) << 1 | +(intersection.x < 0);

        const propertyKey = `tcsmp:slot_${quadrant}`;
        const slotState = sailboat.getProperty(propertyKey) as string;

        const slotLocation = Vec3.add(Mat3.mul(sailboatMatrix, intersection), slotCenter);

        if (isAxe) {
            if (slotState !== "none") {
                system.run(() => {
                    sailboat.setProperty(propertyKey, "none");
                    const drop = new ItemStack(SlotDrops[slotState]);
                    sailboat.dimension.playSound(
                        ItemSounds[drop.typeId], slotLocation, { pitch: 0.8 });
                    if (player.getGameMode() !== GameMode.Creative)
                        sailboat.dimension.spawnItem(drop, slotLocation);
                });
            }
            else event.cancel = true;
        }

        else {
            if (slotState === "none") {
                const newState = withoutNamespace(itemStack.typeId);
                system.run(() => {
                    sailboat.setProperty(propertyKey, newState);
                    sailboat.dimension.playSound(
                        ItemSounds[itemStack.typeId], slotLocation, { pitch: 0.8 });
                });
            }
            else event.cancel = true;
        }
    }
});

world.afterEvents.playerInteractWithEntity.subscribe(event => {
    const { target: sailboat, player, beforeItemStack } = event;
    if (!player.isValid || !sailboat.isValid ||
        !sailboat.matches({ families: ["sailboat"] })) return;

    if (beforeItemStack) {
        system.runTimeout(() => {
            const slot0State = sailboat.getProperty("tcsmp:slot_0") !== "none";
            const slot1State = sailboat.getProperty("tcsmp:slot_1") !== "none";
            const slot2State = sailboat.getProperty("tcsmp:slot_2") !== "none";
            const slot3State = sailboat.getProperty("tcsmp:slot_3") !== "none";

            sailboat.triggerEvent(`tcsmp:fill_${+slot0State}${+slot1State}${+slot2State}${+slot3State}`);
        }, 1);
    }
    // The player has attempted to ride
    else {
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

world.afterEvents.worldLoad.subscribe(() => {
    system.runInterval(() => {
        system.runJob(handleSailboatHealing());
    });
});

function* handleSailboatHealing(): Generator<void, void, void> {
    const dimensions = DimensionTypes.getAll().map(dim => world.getDimension(dim.typeId));
    const sailboats = dimensions.reduce((entities, dim) =>
        entities.concat(dim.getEntities({ families: ["sailboat"] })),
        new Array<Entity>);

    for (const sailboat of sailboats) if (sailboat.isValid) {
        const health = sailboat.getComponent(EntityComponentTypes.Health)!;
        if (health.currentValue < health.effectiveMax)
            health.setCurrentValue(Math.min(health.currentValue + 0.1, health.effectiveMax));

        yield;
    }
}

world.beforeEvents.entityHurt.subscribe(event => {
    const { damage, damageSource, hurtEntity: sailboat } = event;
    if (!sailboat.isValid) return;
    event.cancel = true;

    const player = damageSource.damagingEntity;
    const creativeDestroy = player?.isValid &&
        player instanceof Player &&
        player.getGameMode() === GameMode.Creative;

    const health = sailboat.getComponent(EntityComponentTypes.Health)!;
    system.run(() => {
        if (creativeDestroy) sailboat.remove();
        else if (damage >= health.currentValue) {
            const drop = new ItemStack(sailboat.typeId);
            sailboat.dimension.spawnItem(drop, sailboat.location);
            sailboat.remove();
        }
        else {
            const newHealthValue = health.currentValue - damage;

            health.setCurrentValue(newHealthValue);
            sailboat.setProperty("tcsmp:last_hit_health", newHealthValue);
            sailboat.playAnimation("wobble");
        }
    });
}, { entityFilter: { families: ["sailboat"] } });
