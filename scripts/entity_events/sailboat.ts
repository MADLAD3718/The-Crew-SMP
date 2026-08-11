import { Mat3, Vec2, Vec3 } from "@madlad3718/mcveclib";
import { DimensionTypes, Entity, EntityComponentTypes, EntityDamageCause, GameMode, ItemStack, Player, system, world } from "@minecraft/server";
import { MinecraftBlockTypes, MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { intersect, Plane3, Ray3, viewMatrix } from "../math";
import { clamp, mod, withoutNamespace } from "../util";

const InventorySizes = [9, 27, 54];

const SailVariants: Record<string, number> = {
    [MinecraftItemTypes.WhiteDye]: 0,
    [MinecraftItemTypes.OrangeDye]: 1,
    [MinecraftItemTypes.MagentaDye]: 2,
    [MinecraftItemTypes.LightBlueDye]: 3,
    [MinecraftItemTypes.YellowDye]: 4,
    [MinecraftItemTypes.LimeDye]: 5,
    [MinecraftItemTypes.PinkDye]: 6,
    [MinecraftItemTypes.GrayDye]: 7,
    [MinecraftItemTypes.LightGrayDye]: 8,
    [MinecraftItemTypes.CyanDye]: 9,
    [MinecraftItemTypes.PurpleDye]: 10,
    [MinecraftItemTypes.BlueDye]: 11,
    [MinecraftItemTypes.BrownDye]: 12,
    [MinecraftItemTypes.GreenDye]: 13,
    [MinecraftItemTypes.RedDye]: 14,
    [MinecraftItemTypes.BlackDye]: 15
};

enum SlotStates {
    "none",
    "chest",
    "cannon_item"
};

const TURN_ACCEL = 0.25;
const MAX_TURN_RATE = 2.25;

const THROTTLE_ACCEL = 0.0025;
const THROTTLE_DECCEL = 0.0025;
const MAX_THROTTLE = 0.075;

const ValidSlotItems = [
    MinecraftBlockTypes.Chest,
    "tcsmp:cannon_item"
];

type ItemSound = { place: string, break: string };
const ItemSounds: Record<string, ItemSound> = {
    "minecraft:chest": {
        place: "dig.wood",
        break: "dig.wood"
    },
    "tcsmp:cannon_item": {
        place: "cannon.place",
        break: "cannon.break"
    }
};

const SlotDrops: Record<string, string> = {
    "chest": "minecraft:chest",
    "cannon_item": "tcsmp:cannon_item"
};

world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    const { target: sailboat, player, itemStack } = event;
    if (!player.isValid || !sailboat.isValid || !itemStack ||
        !sailboat.matches({ families: ["sailboat"] })) return;

    const isDye = itemStack.typeId.endsWith("_dye");
    const isAxe = itemStack.hasTag("minecraft:is_axe");
    const isSlotItem = ValidSlotItems.some(value => itemStack.typeId === value);

    if (isDye) {
        const currentVariant = sailboat.getProperty("tcsmp:sail_variant") as number;
        const newVariant = SailVariants[itemStack.typeId];
        if (currentVariant === newVariant) return event.cancel = true;

        system.run(() => {
            sailboat.setProperty("tcsmp:sail_variant", newVariant);
            sailboat.dimension.playSound("sign.dye.use", sailboat.location);
        });
    }
    else if (isAxe || isSlotItem) {
        const strength = sailboat.getProperty("tcsmp:strength") as number;
        if (strength === 2 && itemStack.typeId === MinecraftBlockTypes.Chest)
            return event.cancel = true;

        const sailboatView = sailboat.getViewDirection();

        const slotCenter = Vec3.add(
            Vec3.above(sailboat.location, 0.1875),
            Vec3.mul(sailboatView, 0.5)
        );

        const rayOrigin = Vec3.sub(player.getHeadLocation(), slotCenter);
        const ray: Ray3 = { origin: rayOrigin, direction: player.getViewDirection() };
        const plane: Plane3 = { origin: Vec3.Zero, normal: Vec3.Up };

        const intersection = intersect(ray, plane);
        if (!intersection) return;

        const sailboatMatrix = viewMatrix(sailboatView);
        const invSailboatMatrix = Mat3.inverse(sailboatMatrix);
        const transformedIntersection = Mat3.mul(invSailboatMatrix, intersection);

        // Maps different quadrants of the intersection plane to {0, 1, 2, 3}
        const quadrant = +(transformedIntersection.z < 0) << 1 | +(transformedIntersection.x < 0);

        const slotPropertyKey = `tcsmp:slot_${quadrant}`;
        const slotState = sailboat.getProperty(slotPropertyKey) as string;

        const slotLocation = Vec3.add(Mat3.mul(sailboatMatrix, intersection), slotCenter);

        if (isAxe) {
            if (slotState !== "none") {
                system.run(() => {
                    sailboat.setProperty(slotPropertyKey, "none");
                    const drop = new ItemStack(SlotDrops[slotState]);
                    sailboat.dimension.playSound(ItemSounds[drop.typeId].break, slotLocation);
                    if (player.getGameMode() !== GameMode.Creative)
                        sailboat.dimension.spawnItem(drop, slotLocation);

                    if (slotState === "chest") {
                        const container = sailboat.inventory!.container;
                        for (let i = InventorySizes[strength] - 1; i >= InventorySizes[strength - 1]; --i) {
                            const item = container.getItem(i);
                            if (item) sailboat.dimension.spawnItem(item, slotLocation);
                        }

                        sailboat.triggerEvent(`tcsmp:set_strength_${strength - 1}`);
                        sailboat.nameTag = `§S§A§I§L§B§O§A§T§${strength - 1}`;
                    }
                });
            }
            else event.cancel = true;
        }

        else {
            if (slotState === "none") {
                const newState = withoutNamespace(itemStack.typeId);
                system.run(() => {
                    sailboat.setProperty(slotPropertyKey, newState);
                    sailboat.dimension.playSound(ItemSounds[itemStack.typeId].place, slotLocation);

                    if (newState === "chest") {
                        sailboat.triggerEvent(`tcsmp:set_strength_${strength + 1}`);
                        sailboat.nameTag = `§S§A§I§L§B§O§A§T§${strength + 1}`;
                    }
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

    const isDye = !!beforeItemStack?.typeId.endsWith("_dye");
    const isAxe = !!beforeItemStack?.hasTag("minecraft:is_axe");
    const isSlotItem = !!ValidSlotItems.some(value => beforeItemStack?.typeId === value);

    if (isDye || isAxe || isSlotItem) {
        system.runTimeout(() => {
            const slot0State = SlotStates[sailboat.getProperty("tcsmp:slot_0") as keyof typeof SlotStates];
            const slot1State = SlotStates[sailboat.getProperty("tcsmp:slot_1") as keyof typeof SlotStates];
            const slot2State = SlotStates[sailboat.getProperty("tcsmp:slot_2") as keyof typeof SlotStates];
            const slot3State = SlotStates[sailboat.getProperty("tcsmp:slot_3") as keyof typeof SlotStates];

            sailboat.triggerEvent(`tcsmp:set_slots_${slot0State}${slot1State}${slot2State}${slot3State}`);
        }, 1);
    }
    // The player has attempted to ride
    else {
        const riders = sailboat.getRiders();
        // This event runs *after* the interaction already took place.
        if (riders.length === 0 || riders[0].id !== player.id) return;

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
                this.boat.resetProperty("tcsmp:rotation_rate");
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

        this.boat.setProperty("tcsmp:rotation_rate", this.turnRate);

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

    if (damageSource.cause === EntityDamageCause.fall) return;

    const player = damageSource.damagingEntity;
    const creativeDestroy = player?.isValid &&
        player instanceof Player &&
        player.getGameMode() === GameMode.Creative;

    const health = sailboat.getComponent(EntityComponentTypes.Health)!;
    system.run(() => {
        if (creativeDestroy) {
            sailboat.dropInventory();
            sailboat.remove();
        }
        else if (damage >= health.currentValue) {
            const drop = new ItemStack(sailboat.typeId);
            sailboat.dimension.spawnItem(drop, sailboat.location);

            for (let i = 0; i < 4; ++i) {
                const slotState = sailboat.getProperty(`tcsmp:slot_${i}`) as string;
                if (slotState === "none") continue;

                const slotDrop = new ItemStack(SlotDrops[slotState]);
                sailboat.dimension.playSound(ItemSounds[slotDrop.typeId].break, sailboat.location);
                sailboat.dimension.spawnItem(slotDrop, sailboat.location);
            }

            sailboat.dropInventory();
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

world.afterEvents.entitySpawn.subscribe(({ entity: sailboat }) => {
    if (!sailboat.isValid ||
        !sailboat.matches({ families: ["sailboat"] })) return;

    // Number at the end here used to communicate
    // inventory size to ui.
    sailboat.nameTag = "§S§A§I§L§B§O§A§T§0";
});
