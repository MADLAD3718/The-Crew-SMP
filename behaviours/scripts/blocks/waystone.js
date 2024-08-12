import { Block, BlockComponentPlayerDestroyEvent, BlockComponentPlayerInteractEvent, BlockPermutation, Direction, Player, system, World, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { add, Directions, equal } from "../extensions/vectors";

const WAYSTONE_TYPEIDS = {
    "minecraft:overworld": "tcsmp:overworld_waystone",
    "minecraft:nether": "tcsmp:nether_waystone",
    "minecraft:the_end": "tcsmp:end_waystone"
}

/** @type {import("@minecraft/server").BlockCustomComponent} */
export const waystoneComponent = {
    onPlayerDestroy: breakWaystone,
    onPlayerInteract: interactWaystone
}

world.beforeEvents.itemUseOn.subscribe(event => {
    const {itemStack, blockFace, block} = event;
    if (!itemStack.hasTag("tcsmp:waystone") || blockFace !== Direction.Up) return;
    const target = block.above();
    if (isWater(target)) {
        if (!isWater(target.above()) && target.above().typeId !== "minecraft:air")
            return event.cancel = true;
        const type = itemStack.typeId.substring(6);
        system.run(() => {
            world.structureManager.place(`waterlogged/${type}/bottom`, target.dimension, target.location);
        });
    } else event.cancel = target.above()?.typeId !== "minecraft:air";
});

world.afterEvents.playerPlaceBlock.subscribe(event => {
    const {block, dimension} = event;
    if (!block.hasTag("tcsmp:waystone")) return;
    dimension.playSound("waystone.place", block.center());
    const type = block.typeId.substring(6);

    const above = block.above();
    if (isWater(above)) {
        world.structureManager.place(`waterlogged/${type}/top`, block.dimension, above.location);
    } else above.setPermutation(block.permutation.withState("tcsmp:top", true));
    dimension.spawnEntity("tcsmp:warp_crystal", above.bottomCenter());
});

/** @param {BlockComponentPlayerDestroyEvent} event */
function breakWaystone(event) {
    const {block, player, destroyedBlockPermutation, dimension} = event;
    dimension.playSound("waystone.break", block.center());
    removeCrystal(block, destroyedBlockPermutation);
    const top = destroyedBlockPermutation.getState("tcsmp:top");
    block.offset(top ? Directions.Down : Directions.Up).setType("minecraft:air");
    const location = top ? add(block.location, Directions.Down) : block.location;
    const typeId = destroyedBlockPermutation.type.id;

    const waystone = findWaystone(world, location, typeId) ?? findWaystone(player, location, typeId);
    if (!waystone) return;
    removeWaystone(hasWaystone(world, waystone) ? world : player, waystone);
}

/** @param {BlockComponentPlayerInteractEvent} event */
function interactWaystone(event) {
    const {player, dimension} = event;
    if (WAYSTONE_TYPEIDS[dimension.id] !== event.block.typeId) return;
    dimension.playSound("waystone.interact", event.block.center());
    const top = event.block.permutation.getState("tcsmp:top")
    const block = top ? event.block.below() : event.block;
    if (block.permutation.getState("tcsmp:active")) {
        if (player.isSneaking) editWaystone(block, player);
        else useWaystone(block, player);
    } else setupWaystone(block, player);
}

/**
 * @param {Block} block 
 * @param {Player} player 
 */
function setupWaystone(block, player) {
    const form = new ModalFormData().title({translate: "action.setup.waystone.title"});
    form.textField(
        {translate: "action.setup.waystone.name"},
        {translate: "action.setup.waystone.placeholder", with: [player.name]}
    );
    form.toggle({translate: "action.setup.waystone.global"}, true);
    form.show(player).then(response => {
        if (response.canceled) return;

        const name = response.formValues[0] || `${player.name}'s Waystone`;
        const waystone = {type: block.typeId.substring(6), name: name, location: block.location};
        
        const global = response.formValues[1];
        const context = global ? world : player;
        if (hasWaystone(context, waystone))
            return player.onScreenDisplay.setActionBar({translate: "info.waystone.preexists", with: [name]});

        addWaystone(context, waystone);

        const above = block.above();
        block.setPermutation(block.permutation.withState("tcsmp:active", true));
        above.setPermutation(above.permutation.withState("tcsmp:active", true));
    });
}

/**
 * @param {Block} block 
 * @param {Player} player 
 */
function editWaystone(block, player) {
    const old_waystone = findWaystone(world, block.location, block.typeId) ?? findWaystone(player, block.location, block.typeId);
    const is_global = hasWaystone(world, old_waystone);
    if (!is_global && !hasWaystone(player, old_waystone)) return useWaystone(block, player);

    const form = new ModalFormData().title({translate: "action.edit.waystone.title"});
    form.textField(
        {translate: "action.setup.waystone.name"},
        {translate: "action.setup.waystone.placeholder", with: [player.name]},
        old_waystone.name
    );
    form.toggle({translate: "action.setup.waystone.global"}, is_global);
    form.show(player).then(response => {
        if (response.canceled) return;
        removeWaystone(is_global ? world : player, old_waystone);

        const name = response.formValues[0] || `${player.name}'s Waystone`;
        const new_waystone = {type: old_waystone.type, name: name, location: block.location};
        
        const global = response.formValues[1];
        const context = global ? world : player;

        if (hasWaystone(context, new_waystone)) {
            player.onScreenDisplay.setActionBar({translate: "info.waystone.preexists", with: [name]});
            const above = block.above();
            block.setPermutation(block.permutation.withState("tcsmp:active", false));
            above.setPermutation(above.permutation.withState("tcsmp:active", false));
        } else addWaystone(context, new_waystone);
    });
}

/**
 * @param {Block} block
 * @param {Player} player
 */
function useWaystone(block, player) {
    const home = findWaystone(world, block.location, block.typeId) ?? findWaystone(player, block.location, block.typeId);

    const waystones = [];
    const form = new ActionFormData().title({translate: "action.interact.waystone.title"});
    for (const waystone of getWayStones(world, home.type)) {
        if (equal(waystone.location, home.location)) continue;
        form.button(waystone.name, "textures/ui/waystone_global_glyph");
        waystones.push(waystone);
    }
    for (const waystone of getWayStones(player, home.type)) {
        if (equal(waystone.location, home.location)) continue;
        form.button(waystone.name, "textures/ui/waystone_private_glypth");
        waystones.push(waystone);
    }

    if (waystones.length == 0) return;
    form.show(player).then(response => {
        if (response.canceled) return;
        const target = waystones[response.selection];
        player.playSound("waystone.teleport");
        player.camera.fade({fadeColor: {red: 0.914, green: 0.882, blue: 0.851}, fadeTime: {
            fadeInTime: 0.0,
            holdTime: 1.0,
            fadeOutTime: 0.8
        }});
        player.teleport(target.location);
    });
}

/**
 * @param {Block} block
 * @param {BlockPermutation} permutation
 */
function removeCrystal(block, permutation) {
    const top = permutation.getState('tcsmp:top');
    const location = top ? block.location : add(block.location, Directions.Up);
    block.dimension.getEntitiesAtBlockLocation(location)[0]?.remove();
}

/** @param {Block} block */
function isWater(block) {
    return block?.typeId == "minecraft:water" || block?.typeId == "minecraft:flowing_water";
}

/** @typedef {{x: Number, y: Number, z: Number}} Vector3 */
/** @typedef {{type: String, name: String, location: Vector3}} Waystone */

/**
 * @param {World | Player} context 
 * @param {String} type 
 * @returns {Waystone[]}
 */
function getWayStones(context, type) {
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
function findWaystone(context, location, typeId) {
    const type = typeId.substring(6);
    for (const id of context.getDynamicPropertyIds()) {
        if (!id.startsWith(`${type}:`)) continue;
        if (equal(location, context.getDynamicProperty(id)))
            return {
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
function hasWaystone(context, waystone) {
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
function removeWaystone(context, waystone) {
    context.setDynamicProperty(`${waystone.type}:${waystone.name}`);
}

/**
 * @param {World | Player} context
 * @param {Waystone} waystone
 */
function addWaystone(context, waystone) {
    context.setDynamicProperty(`${waystone.type}:${waystone.name}`, waystone.location);
}
