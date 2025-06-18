import { BlockCustomComponent, world } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { BlockEntityRegistry } from "../systems/block_entities";

const doubleBlockComponent: BlockCustomComponent = {
    onPlace(event) {
        const { block } = event, { permutation } = block;
        if (!permutation.getState("tcsmp:top"))
            block.above()?.setPermutation(permutation.withState("tcsmp:top", true));
    },

    onPlayerBreak(event) {
        const { block, brokenBlockPermutation } = event;

        const other = brokenBlockPermutation.getState("tcsmp:top") ? block.below() : block.above();

        if (other?.getComponent("tcsmp:block_entity")?.isValid)
            BlockEntityRegistry.remove(other);

        other?.setType(MinecraftBlockTypes.Air);
    }
}

export default doubleBlockComponent;
