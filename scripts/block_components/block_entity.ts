import { BlockCustomComponent } from "@minecraft/server";
import { BlockEntityRegistry } from "../systems/block_entities";

type BlockEntityParameters = {
    entity: string
}

const blockEntityComponent: BlockCustomComponent = {
    onPlace(event, parameters) {
        const { params } = parameters as { params: BlockEntityParameters };
        BlockEntityRegistry.spawn(event.block, params.entity);
    },

    onPlayerBreak(event) {
        BlockEntityRegistry.remove(event.block);
    }
}

export default blockEntityComponent;
