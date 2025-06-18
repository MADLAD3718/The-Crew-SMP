import { Block, BlockCustomComponent, EquipmentSlot, GameMode } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";

const cropComponent: BlockCustomComponent = {
    onRandomTick(event) {
        const { block } = event, { permutation } = block;

        const below = block.below() as Block;
        const hydrated = below.permutation.getState("moisturized_amount") ?? 0 > 0;
        const growth_chance = hydrated ? 1/3 : 1/7;
        if (Math.random() >= growth_chance) return;

        const growth = permutation.getState("tcsmp:growth_stage") ?? 0;
        if (growth < 2)
            block.setPermutation(permutation.withState("tcsmp:growth_stage", growth + 1));
    },
    
    onPlayerInteract(event) {
        const { player, block, dimension } = event, { permutation } = block;
        const slot = player?.equipment.getEquipmentSlot(EquipmentSlot.Mainhand);
        if (!slot?.hasItem() || slot?.typeId != MinecraftItemTypes.BoneMeal) return;

        dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
        dimension.playSound("item.bone_meal.use", block.center());

        block.setPermutation(permutation.withState("tcsmp:growth_stage", 2));

        if (player?.getGameMode() != GameMode.Creative)
            if (slot.hasItem()) slot.decrement();
    }
}

export default cropComponent;
