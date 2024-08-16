import { Player, World } from "@minecraft/server";
import { equal } from "./extensions/vectors";

/** @typedef {{x: Number, y: Number, z: Number}} Vector3 */
/** @typedef {{type: String, name: String, location: Vector3}} Waystone */

export const WAYSTONE_TYPEIDS = {
    "minecraft:overworld": "tcsmp:overworld_waystone",
    "minecraft:nether": "tcsmp:nether_waystone",
    "minecraft:the_end": "tcsmp:end_waystone"
}

/**
 * @param {World | Player} context 
 * @param {String} type 
 * @returns {Waystone[]}
 */
export function getWayStones(context, type) {
    const waystones = [];
    for (const id of context.getDynamicPropertyIds()) {
        if (!id.startsWith(`${type}:`)) continue;
        const name = id.substring(type.length + 1);
        const location = context.getDynamicProperty(id);
        waystones.push({type: type, name: name, location: location});
    }
    return waystones;
}

/**
 * @param {World | Player} context 
 * @param {Vector3} location 
 * @param {String} typeId 
 * @returns {Waystone | undefined}
 */
export function findWaystone(context, location, typeId) {
    const type = typeId.substring(6);
    for (const id of context.getDynamicPropertyIds()) {
        if (!id.startsWith(`${type}:`)) continue;
        if (equal(location, context.getDynamicProperty(id)))
            return {
                type: type,
                name: id.substring(type.length + 1),
                location: location
            };
    }
    return undefined;
}

/**
 * @param {World | Player} context 
 * @param {Waystone} waystone 
 * @returns {Boolean}
 */
export function hasWaystone(context, waystone) {
    for (const id of context.getDynamicPropertyIds()) {
        if (!id.startsWith(`${waystone.type}:`)) continue;
        if (id.substring(waystone.type.length + 1) === waystone.name) return true;
    }
    return false;
}

/**
 * @param {World | Player} context
 * @param {Waystone} waystone
 */
export function removeWaystone(context, waystone) {
    context.setDynamicProperty(`${waystone.type}:${waystone.name}`);
}

/**
 * @param {World | Player} context
 * @param {Waystone} waystone
 */
export function addWaystone(context, waystone) {
    context.setDynamicProperty(`${waystone.type}:${waystone.name}`, waystone.location);
}
