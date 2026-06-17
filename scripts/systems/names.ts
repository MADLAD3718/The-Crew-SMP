import { world } from "@minecraft/server";
import { DynamicPropertyDatabase } from "./dynamic_property_database";

const NameDatabase = new DynamicPropertyDatabase(world, "lastknownname", "id");

export namespace NameRegistry {
    export function getName(id: string): string | undefined {
        return NameDatabase.read({ id }) as string | undefined;
    }

    export function setName(id: string, name: string): void {
        return NameDatabase.write({ id }, name);
    }
}
