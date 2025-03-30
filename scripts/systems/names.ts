import { world } from "@minecraft/server";

export namespace NameRegistry {
    export function getName(id: string): string | undefined {
        return world.getDynamicProperty(`lastknownname/${id}`) as string | undefined;
    }

    export function setName(id: string, name: string): void {
        world.setDynamicProperty(`lastknownname/${id}`, name);
    }
}
