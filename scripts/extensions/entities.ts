import { Entity, EntityComponentTypes, EntityInventoryComponent, EntityLeashableComponent, EntityRideableComponent, ItemStack, Player, system, world } from "@minecraft/server";
import { MissingComponentError } from "../util";
import { Matrix3 } from "@madlad3718/mcveclib";
import { worker } from "node:cluster";

declare module "@minecraft/server" {
    interface Player {
        /**
         * Stops a sound for this particular player with an optional `sound` string .
         * @param sound A string from the sound enum of the sound to stop.
         */
        stopSound(sound?: string): void;
        /**
         * Defines this player's inventory properties.
         */
        readonly inventory: EntityInventoryComponent;
        /**
         * Provides access to this player's equipment slots.
         */
        readonly equipment: EntityEquippableComponent;
        /**
         * Gets this player's view matrix, in TBN format.
         */
        getViewMatrix(): Matrix3;
    }
    interface Entity {
        /**
         * Defines this entity's inventory properties.
         */
        readonly inventory?: EntityInventoryComponent;
        /**
         * Provides access to a mob's equipment slots.
         */
        readonly equipment?: EntityEquippableComponent;
        /**
         * Controls the properties of a projectile entity and allows it to be shot in a given direction.
         */
        readonly projectile?: EntityProjectileComponent;
        /**
         * Adds an entity to this entity as a rider.
         *
         * This function can't be called in read-only mode.
         *
         * @param rider
         * Entity that will become the rider of this entity.
         * @returns
         * True if the rider entity was successfully added.
         * @throws This function can throw errors.
         */
        addRider(rider: Entity): boolean;
        /**
         * Ejects the specified rider of this entity.
         *
         * This function can't be called in read-only mode.
         *
         * @param rider
         * Entity that should be ejected from this entity.
         * @throws This function can throw errors.
         */
        ejectRider(rider: Entity): void;
        /**
         * Ejects all riders of this entity.
         *
         * This function can't be called in read-only mode.
         *
         * @throws This function can throw errors.
         */
        ejectRiders(): void;
        /**
         * Gets a list of the all the entities currently riding this
         * entity.
         *
         * @throws This function can throw errors.
         */
        getRiders(): Entity[];
        /**
         * Drops the contents of this entity's inventory on the ground.
         */
        dropInventory(): void;
        /**
         * The entity this entity is currently riding on.
         */
        readonly entityRidingOn?: Entity;
        /**
         * Leashes this entity to another entity.
         *
         * This function can't be called in read-only mode.
         *
         * @param leashHolder
         * The entity to leash this entity to.
         * @throws
         * Throws if the entity to leash to is over the max distance,
         * and if the player is dead or in spectator mode.
         */
        leashTo(leashHolder: Entity): void;
        /**
         * Unleashes this entity if it is leashed to another entity.
         *
         * This function can't be called in read-only mode.
         *
         * @throws This function can throw errors.
         */
        unleash(): void;
        /**
         * Entity that is holding the leash.
         *
         * @throws This property can throw when used.
         */
        readonly leashHolder?: Entity;
        /**
         * Whether the entity is invunerable - that is, it has been hurt within the last 10 ticks.
         */
        readonly isInvunerable: boolean;
    }
}

Player.prototype.stopSound = function (sound?: string) {
    this.runCommand("stopsound @s " + sound);
}

const DamageTimes: Record<string, number> = {};
world.afterEvents.entityHurt.subscribe(({hurtEntity}) => {
    DamageTimes[hurtEntity.id] = system.currentTick;
});

Object.defineProperties(Entity.prototype, {
    inventory: {
        get() {
            if (!this.isValid) return undefined;
            else return this.getComponent(EntityComponentTypes.Inventory);
        }
    },
    equipment: {
        get() {
            if (!this.isValid) return undefined;
            else return this.getComponent(EntityComponentTypes.Equippable);
        }
    },
    projectile: {
        get() {
            if (!this.isValid) return undefined;
            else return this.getComponent(EntityComponentTypes.Projectile);
        }
    },
    entityRidingOn: {
        get() {
            if (!this.isValid) return undefined;
            else return this.getComponent(EntityComponentTypes.Riding)?.entityRidingOn;
        }
    },
    leashHolder: {
        get() {
            if (!this.isValid) return undefined;
            else return this.getComponent(EntityComponentTypes.Leashable)?.leashHolder;
        }
    },
    isInvunerable: {
        get() {
            return system.currentTick - (DamageTimes[this.id] ?? 0) < 10;
        }
    }
});

Entity.prototype.addRider = function (rider: Entity): boolean {
    const component = this.getComponent(EntityComponentTypes.Rideable) as EntityRideableComponent;
    if (!component) throw new MissingComponentError(EntityComponentTypes.Rideable);
    return component.addRider(rider);
}

Entity.prototype.ejectRider = function (rider: Entity): void {
    const component = this.getComponent(EntityComponentTypes.Rideable) as EntityRideableComponent;
    if (!component) throw new MissingComponentError(EntityComponentTypes.Rideable);
    return component.ejectRider(rider);
}

Entity.prototype.ejectRiders = function (): void {
    const component = this.getComponent(EntityComponentTypes.Rideable) as EntityRideableComponent;
    if (!component) throw new MissingComponentError(EntityComponentTypes.Rideable);
    return component.ejectRiders();
}

Entity.prototype.getRiders = function (): Entity[] {
    const component = this.getComponent(EntityComponentTypes.Rideable) as EntityRideableComponent;
    if (!component) throw new MissingComponentError(EntityComponentTypes.Rideable);
    return component.getRiders();
}

Entity.prototype.dropInventory = function (): void {
    const component = this.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent;
    if (!component) throw new MissingComponentError(EntityComponentTypes.Inventory);

    const { container, inventorySize } = component;
    for (let i = 0; i < inventorySize; ++i) {
        const slot = container?.getSlot(i);
        if (!slot?.hasItem()) continue;

        this.dimension.spawnItem(slot?.getItem() as ItemStack, this.location);
        slot.setItem();
    }
}

Entity.prototype.leashTo = function (leashHolder: Entity): void {
    const component = this.getComponent(EntityComponentTypes.Leashable) as EntityLeashableComponent;
    if (!component) throw new MissingComponentError(EntityComponentTypes.Leashable);

    return component.leashTo(leashHolder);
}

Entity.prototype.unleash = function (): void {
    const component = this.getComponent(EntityComponentTypes.Leashable) as EntityLeashableComponent;
    if (!component) throw new MissingComponentError(EntityComponentTypes.Leashable);

    return component.unleash();
}
