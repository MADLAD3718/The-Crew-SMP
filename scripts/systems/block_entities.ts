import { Block, Entity, Vector3, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

export namespace BlockEntityRegistry {
    export function get(block: Block): Entity | undefined {
        for (const id of world.getDynamicPropertyIds()) {
            const [type, dimension, entityId] = id.split('/');
            if (type != "block_entity" ||
                dimension != block.dimension.id
            ) continue;

            const location = world.getDynamicProperty(id) as Vector3;
            if (Vec3.equal(block.location, location))
                return world.getEntity(entityId);
        }

        return undefined;
    }

    export function spawn(block: Block) {
        const { dimension, location } = block;
        const identifier = block.getTags().find(tag => tag.startsWith("entity:"))?.slice(7);
        const entity = dimension.spawnEntity(identifier as string, block.bottomCenter());
        world.setDynamicProperty(`block_entity/${dimension.id}/${entity.id}`, location);
    }

    export function remove(block: Block) {
        for (const id of world.getDynamicPropertyIds()) {
            const [type, dimension, entityId] = id.split('/');
            if (type != "block_entity" ||
                dimension != block.dimension.id
            ) continue;

            const location = world.getDynamicProperty(id) as Vector3;
            if (Vec3.equal(block.location, location)) {
                world.getEntity(entityId)?.remove();
                return world.setDynamicProperty(id);
            }
        }
    }
}
