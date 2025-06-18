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

    export function spawn(block: Block, typeId: string) {
        const { dimension, location } = block;
        const entity = dimension.spawnEntity(typeId, block.bottomCenter());
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
