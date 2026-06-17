import { Block, Entity, Vector3, world } from "@minecraft/server";
import { DynamicPropertyDatabase } from "./dynamic_property_database";
import { Vec3 } from "@madlad3718/mcveclib";

const BlockEntityDatabase = new DynamicPropertyDatabase(world, "blockentity", "dimension", "entityId");

export namespace BlockEntityRegistry {
    export function get(block: Block): Entity | undefined {
        const entityId = BlockEntityDatabase.findAll(field => {
            return field.dimension == block.dimension.id;
        }).find(match => {
            return Vec3.equal(block.location, match.value as Vector3);
        })?.field.entityId;
        return entityId ? world.getEntity(entityId) : undefined;
    }

    export function spawn(block: Block, typeId: string) {
        const { dimension, location } = block;
        const entity = dimension.spawnEntity(typeId, block.bottomCenter());
        BlockEntityDatabase.write({dimension: dimension.id, entityId: entity.id}, location);
    }

    export function remove(block: Block) {
        const match = BlockEntityDatabase.findAll(field => {
            return field.dimension == block.dimension.id;
        }).find(match => {
            return Vec3.equal(block.location, match.value as Vector3);
        });
        if (match?.field.entityId) {
            world.getEntity(match.field.entityId)?.remove();
            BlockEntityDatabase.write(match.field);
        }
    }
}
