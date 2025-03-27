import { Block, BlockCustomComponent } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { BlockEntityRegistry } from "../systems/block_entities";

const doubleBlockComponent: BlockCustomComponent = {
    onPlace(event) {
        const { block } = event, { permutation } = block;
        if (!permutation.getState("tcsmp:top"))
            block.above()?.setPermutation(permutation.withState("tcsmp:top", true));
    },

    onPlayerDestroy(event) {
        const {block, destroyedBlockPermutation} = event;
        
        const other = destroyedBlockPermutation.getState("tcsmp:top") ? block.below() : block.above();

        if (other?.getTags().find(tag => tag.startsWith("entity:")))
            BlockEntityRegistry.remove(other as Block);

        other?.setType(MinecraftBlockTypes.Air);
    }
}

export default doubleBlockComponent;
