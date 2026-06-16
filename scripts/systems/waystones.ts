import { Block, Player, Vector3, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";
import { FactionRegistry } from "./factions";
import { within } from "../util";

export type WaystoneRegister = {
    name: string,
    owner: string,
    dimension: string,
    location: Vector3
}

export namespace WaystoneRegistry {
    export function get(context: Player): WaystoneRegister[] {
        const waystones: WaystoneRegister[] = [];
        for (const id of world.getDynamicPropertyIds()) {
            const [type, owner, dimension, name] = id.split('/');

            const faction = FactionRegistry.getFaction(context);

            if (type != "waystone" ||
                dimension != context.dimension.id ||
                (owner != "" && owner != context.id &&
                    !faction?.players.includes(owner))
            ) continue;

            waystones.push({
                name,
                owner,
                dimension,
                location: world.getDynamicProperty(id) as Vector3
            });
        }

        return waystones;
    }

    export function find(base: Block): WaystoneRegister | undefined {
        for (const id of world.getDynamicPropertyIds()) {
            const [type, owner, dimension, name] = id.split('/');
            if (type != "waystone" ||
                dimension != base.dimension.id
            ) continue;

            const location = world.getDynamicProperty(id) as Vector3;
            if (Vec3.equal(base.location, location)) return {
                name,
                owner,
                dimension,
                location: location
            };
        }

        return undefined;
    }

    export function has(context: Player, waystone: WaystoneRegister): boolean {
        for (const id of world.getDynamicPropertyIds()) {
            const [type, owner, dimension, name] = id.split('/');

            const faction = FactionRegistry.getFaction(context);

            if (type != "waystone" ||
                dimension != context.dimension.id ||
                (owner != "" && owner != context.id &&
                    !faction?.players.includes(owner))
            ) continue;

            if (waystone.owner == owner && waystone.name == name && 
                Vec3.equal(waystone.location, world.getDynamicProperty(id) as Vector3))
                return true;
        }

        return false;
    }

    export function add(waystone: WaystoneRegister) {
        world.setDynamicProperty(
            `waystone/${waystone.owner}/${waystone.dimension}/${waystone.name}`,
            waystone.location
        );
    }

    export function remove(waystone: WaystoneRegister) {
        world.setDynamicProperty(
            `waystone/${waystone.owner}/${waystone.dimension}/${waystone.name}`
        );
    }

    export function valid(waystone: WaystoneRegister): boolean {
        const heightRange = world.getDimension(waystone.dimension).heightRange;

        const validName = waystone.name.length > 0 && !waystone.name.includes('/');
        const validPosition = within(waystone.location.y, heightRange);

        return validName && validPosition;
    }
}
