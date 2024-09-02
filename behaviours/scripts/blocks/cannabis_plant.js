import { GameMode } from "@minecraft/server";
import { decrementSlot } from "../common";
import "../extensions/entities";

/** @type {import("@minecraft/server").BlockCustomComponent} */
export const cannabisPlantComponent = {
    onRandomTick(event) {
        const {block} = event, {permutation} = block;
        const growth = permutation.getState("tcsmp:growth") ?? 0;
        const moisture = block.below().permutation.getState("moisturized_amount") ?? 0;
        const increase = moisture > 0 ? 2 : 1;
        const new_growth = Math.min(growth + increase, 7);
        block.setPermutation(permutation.withState("tcsmp:growth", new_growth));
    },
    onPlayerInteract(event) {
        const {player, block, dimension} = event, {permutation} = block;
        if (player.getHeldItem()?.typeId !== "minecraft:bone_meal") return;
        if (player.getGameMode() != GameMode.creative)
            decrementSlot(player.inventory.container, player.selectedSlotIndex);
        block.setPermutation(permutation.withState("tcsmp:growth", 7));
        dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
        dimension.playSound("item.bone_meal.use", block.center());
    }
}
