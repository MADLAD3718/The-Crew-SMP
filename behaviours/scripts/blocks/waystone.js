import { Block, BlockComponentPlayerDestroyEvent, BlockComponentPlayerInteractEvent, BlockPermutation, Direction, Player, system, World, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { add, Directions, equal } from "../extensions/vectors";

/** @type {import("@minecraft/server").BlockCustomComponent} */
export const waystoneComponent = {
    onPlayerDestroy: breakWaystone,
    onPlayerInteract: interactWaystone
}

world.beforeEvents.itemUseOn.subscribe(event => {
    const {itemStack, blockFace, block} = event;
    if (itemStack.typeId !== "tcsmp:waystone" || blockFace !== Direction.Up) return;
    const target = block.above();
    if (isWater(target)) {
        if (!isWater(target.above()) && target.above().typeId !== "minecraft:air")
            return event.cancel = true;
        system.run(() => {
            world.structureManager.place(`waterlogged/waystone/bottom`, target.dimension, target.location);
        });
    } else event.cancel = target.above()?.typeId !== "minecraft:air";
});

world.afterEvents.playerPlaceBlock.subscribe(event => {
    const {block, player, dimension} = event;
    if (block.typeId !== "tcsmp:waystone") return;
    dimension.playSound("waystone.place", block.center());

    const above = block.above();
    if (isWater(above)) {
        world.structureManager.place(`waterlogged/waystone/top`, block.dimension, above.location);
    } else above.setPermutation(block.permutation.withState("tcsmp:top", true));
    dimension.spawnEntity("tcsmp:warp_crystal", above.bottomCenter());
    setupWaystone(block, player);
});

/** @param {BlockComponentPlayerDestroyEvent} event */
function breakWaystone(event) {
    const {block, player, destroyedBlockPermutation, dimension} = event;
    dimension.playSound("waystone.break", block.center());
    removeCrystal(block, destroyedBlockPermutation);
    const top = destroyedBlockPermutation.getState("tcsmp:top");
    block.offset(top ? Directions.Down : Directions.Up).setType("minecraft:air");
    const location = top ? add(block.location, Directions.Down) : block.location;
    const waystone = findWaystone(world, location) ?? findWaystone(player, location);
    if (!waystone) return;
    removeWaystone(world, waystone);
    removeWaystone(player, waystone);
}

/** @param {BlockComponentPlayerInteractEvent} event */
function interactWaystone(event) {
    const {player, dimension} = event;
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
        const waystone = {name: name, location: block.location};
        
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
    let global = true;
    let old_waystone = findWaystone(world, block.location);
    if (!old_waystone) {
        old_waystone = findWaystone(player, block.location);
        global = false;
    }

    const form = new ModalFormData().title({translate: "action.edit.waystone.title"});
    form.textField(
        {translate: "action.setup.waystone.name"},
        {translate: "action.setup.waystone.placeholder", with: [player.name]},
        old_waystone.name
    );
    form.toggle({translate: "action.setup.waystone.global"}, global);
    form.show(player).then(response => {
        if (response.canceled) return;
        removeWaystone(world, old_waystone);
        removeWaystone(player, old_waystone);

        const name = response.formValues[0] || `${player.name}'s Waystone`;
        const new_waystone = {name: name, location: block.location};
        
        const global = response.formValues[1];
        const context = global ? world : player;
        if (hasWaystone(context, new_waystone)) {
            player.onScreenDisplay.setActionBar({translate: "info.waystone.preexists", with: [name]});
            const above = block.above();
            block.setPermutation(block.permutation.withState("tcsmp:active", false));
            above.setPermutation(above.permutation.withState("tcsmp:active", false));
            return;
        }

        addWaystone(context, new_waystone);
    });
}

/**
 * @param {Block} block
 * @param {Player} player
 */
function useWaystone(block, player) {
    const home = findWaystone(world, block.location) ?? findWaystone(player, block.location);

    const waystones = [];
    const form = new ActionFormData().title({translate: "action.interact.waystone.title"});
    for (const waystone of getWayStones(world)) {
        if (waystone.name === home.name) continue;
        form.button(waystone.name, "textures/ui/waystone_global_glyph");
        waystones.push(waystone);
    }
    for (const waystone of getWayStones(player)) {
        if (waystone.name === home.name) continue;
        form.button(waystone.name, "textures/ui/waystone_private_glypth");
        waystones.push(waystone);
    }

    if (waystones.length == 0) return;
    form.show(player).then(response => {
        if (response.canceled) return;
        const target = waystones[response.selection];
        player.playSound("waystone.teleport");
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
/** @typedef {{name: String, location: Vector3}} Waystone */

/**
 * @param {World | Player} context 
 * @returns {Waystone[]}
 */
function getWayStones(context) {
    const waystones = [];
    for (const id of context.getDynamicPropertyIds()) {
        if (!id.startsWith("waystone:")) continue;
        const name = id.substring(9);
        const location = context.getDynamicProperty(id);
        waystones.push({name: name, location: location});
    }
    return waystones;
}

/**
 * @param {World | Player} context 
 * @param {Vector3} location 
 * @returns {Waystone | undefined}
 */
function findWaystone(context, location) {
    for (const id of context.getDynamicPropertyIds()) {
        if (!id.startsWith("waystone:")) continue;
        if (equal(location, context.getDynamicProperty(id)))
            return {
                name: id.substring(9),
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
        if (!id.startsWith("waystone:")) continue;
        if (id.substring(9) === waystone.name) return true;
    }
    return false;
}

/**
 * @param {World | Player} context
 * @param {Waystone} waystone
 */
function removeWaystone(context, waystone) {
    context.setDynamicProperty(`waystone:${waystone.name}`);
}

/**
 * @param {World | Player} context
 * @param {Waystone} waystone
 */
function addWaystone(context, waystone) {
    context.setDynamicProperty(`waystone:${waystone.name}`, waystone.location);
}
