import { DynamicPropertyDatabase } from "./dynamic_property_database";
import { Block, Player, Vector3, world } from "@minecraft/server";
import { FactionRegistry } from "./factions";
import { Vec3 } from "@madlad3718/mcveclib";
import { within } from "../util";

const WaystoneDatabase = new DynamicPropertyDatabase(world, "waystone", "owner", "placer", "dimension", "name");

export type WaystoneRegister = {
    name: string,
    owner: string,
    placer: string,
    dimension: string,
    location: Vector3
}

export namespace WaystoneRegistry {
    export function get(context: Player): WaystoneRegister[] {
        const faction = FactionRegistry.getFaction(context);

        return WaystoneDatabase.findAll(field => {
            return field.dimension == context.dimension.id &&
                   (field.owner == "" || field.owner == context.id ||
                   !!faction?.players.includes(field.owner));
        }).map(match => {
            return {
                name: match.field.name,
                owner: match.field.owner,
                placer: match.field.placer,
                dimension: match.field.dimension,
                location: match.value as Vector3
            };
        });
    }

    export function find(base: Block): WaystoneRegister | undefined {
        return WaystoneDatabase.findAll(field => {
            return field.dimension == base.dimension.id;
        }).filter(match => {
            return Vec3.equal(base.location, match.value as Vector3);
        }).map(match => {
            return {
                name: match.field.name,
                owner: match.field.owner,
                placer: match.field.placer,
                dimension: match.field.dimension,
                location: match.value as Vector3
            };
        })[0];
    }

    export function has(context: Player, waystone: WaystoneRegister): boolean {
        const faction = FactionRegistry.getFaction(context);

        return WaystoneDatabase.findAll(field => {
            return field.dimension == context.dimension.id &&
                   (field.owner == "" || field.owner == context.id &&
                   !!faction?.players.includes(field.owner));
        }).filter(match => {
            return waystone.owner == match.field.owner &&
                   waystone.name == match.field.name &&
                   Vec3.equal(waystone.location, match.value as Vector3);
        }).length > 0;
    }

    export function add(waystone: WaystoneRegister) {
        return WaystoneDatabase.write(waystone, waystone.location);
    }

    export function remove(waystone: WaystoneRegister) {
        return WaystoneDatabase.write(waystone);
    }

    export function valid(waystone: WaystoneRegister): boolean {
        const heightRange = world.getDimension(waystone.dimension).heightRange;

        const validName = waystone.name.length > 0 && !waystone.name.includes('/');
        const validPosition = within(waystone.location.y, heightRange);

        return validName && validPosition;
    }
}
