import { Dimension, Vector3 } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

declare module "@minecraft/server" {
    interface Dimension {
        /**
         * Drops a given loot table into the world.
         * @param location The position to spawn the loot in.
         * @param loot_table The path to the loot table.
         */
        spawnLoot(location: Vector3, loot_table: string): void;
    }
}

Dimension.prototype.spawnLoot = function (location: Vector3, loot_table: string): void {
    this.runCommand(`loot spawn ${Vec3.toString(location)} loot "${loot_table}"`);
}
