import "@minecraft/server"
import { Dimension } from "@minecraft/server";

declare module "@minecraft/server" {
    interface Entity {
        /** The current health of the entity. */
        health: number;
        /** The maximum health of the entity. */
        readonly maxHealth: number;
        /** The entity's inventory. */
        readonly inventory?: EntityInventoryComponent;
        /** The entity's equipment. */
        readonly equipment?: EntityEquippableComponent;
    }
    interface Player {
        /** Stops a specified sound. If no sound is specified all sounds are stopped. */
        stopSound(sound?: string): void;
    }
}
