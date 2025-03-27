import { BlockCustomComponent } from "@minecraft/server";
import { BlockEntityRegistry } from "../systems/block_entities";

const blockEntityComponent: BlockCustomComponent = {
    onPlace(event) {
        BlockEntityRegistry.spawn(event.block);
    },

    onPlayerDestroy(event) {
        BlockEntityRegistry.remove(event.block);
    }
}

export default blockEntityComponent;
