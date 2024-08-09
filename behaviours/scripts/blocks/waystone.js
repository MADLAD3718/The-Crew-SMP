import { Block, BlockComponentPlayerDestroyEvent, BlockComponentPlayerInteractEvent, Direction, Player, World, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { Directions, equal } from "../extensions/vectors";

/** @type {import("@minecraft/server").BlockCustomComponent} */
export const waystoneComponent = {
    onPlayerDestroy: breakWaystone,
    onPlayerInteract: interactWaystone
}

world.beforeEvents.itemUseOn.subscribe(event => {
    const {itemStack, blockFace, block} = event;
    if (itemStack.typeId !== "tcsmp:waystone" || blockFace !== Direction.Up) return;
    event.cancel = block.above(2)?.typeId !== "minecraft:air";
});

world.afterEvents.playerPlaceBlock.subscribe(event => {
    const {block, player} = event;
    if (block.typeId !== "tcsmp:waystone") return;

    block.above().setPermutation(block.permutation.withState("tcsmp:top", true));

    setupWaystone(block, player);
});

/** @param {BlockComponentPlayerDestroyEvent} event */
function breakWaystone(event) {
    const {block, destroyedBlockPermutation} = event;
    const top = destroyedBlockPermutation.getState("tcsmp:top");
    block.offset(top ? Directions.Down : Directions.Up).setType("minecraft:air");
}

/** @param {BlockComponentPlayerInteractEvent} event */
function interactWaystone(event) {
    const {player} = event;
    const top = event.block.permutation.getState("tcsmp:top")
    const block = top ? event.block.below() : event.block;
    if (block.permutation.getState("tcsmp:active")) {

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
        const global = response.formValues[1];

        const context = global ? world : player;
        if (hasWaystone(context, {name: name, location: block.location}))
            return player.onScreenDisplay.setActionBar({translate: "info.waystone.preexists", with: [name]});

        addWaystone(context, {name: name, location: block.location});
        block.setPermutation(block.permutation.withState("tcsmp:active", true));
    });
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
 * @param {String | Vector3} search
 */
function removeWaystone(context, search) {
    if (typeof search == "string") {
        context.setDynamicProperty(`waystone:${waystone.name}`);
    } else {
        for (const id of context.getDynamicPropertyIds()) {
            if (!id.startsWith("waystone:")) continue;
            const location = context.getDynamicProperty(id);
            if (equal(location, search))
                return context.setDynamicProperty(id);
        }
    }
}

/**
 * @param {World | Player} context
 * @param {Waystone} waystone
 */
function addWaystone(context, waystone) {
    context.setDynamicProperty(`waystone:${waystone.name}`, waystone.location);
}
