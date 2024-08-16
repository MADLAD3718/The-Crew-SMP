import { ItemComponentUseEvent, ItemComponentUseOnEvent, MolangVariableMap, world } from "@minecraft/server";
import { findWaystone, WAYSTONE_TYPEIDS } from "../waystone_util";
import "../extensions/entities";

world.beforeEvents.itemUse.subscribe(event => {
    const {itemStack, source} = event, {dimension} = source;
    if (itemStack.typeId !== "tcsmp:scroll_of_return") return;

    event.cancel = itemStack.getDynamicPropertyIds().length == 0;
    if (event.cancel)
        return source.sendMessage({translate: "info.return_scroll.unlinked"});
    
    const key = itemStack.getDynamicPropertyIds()[0];
    if (WAYSTONE_TYPEIDS[dimension.id] == key) return;

    source.sendMessage({translate: "info.return_scroll.wrong_dimension", with: itemStack.getLore()});
    event.cancel = true;
});

/** @type {import("@minecraft/server").ItemCustomComponent} */
export const returnSpellComponent = {
    onUse: useReturnSpell,
    onUseOn: linkReturnSpell
}

/** @param {ItemComponentUseEvent} event  */
function useReturnSpell(event) {
    const {source, itemStack} = event, {dimension} = source;
    source.stopSound("random.bow");
    const head = source.getHeadLocation();
    const soundOptions = {pitch: 0.95 + 0.1 * Math.random()};
    dimension.playSound("scroll.cast", head, soundOptions);

    const vars = new MolangVariableMap();
    vars.setColorRGB("colour", {red: 0.64, green: 0.84, blue: 0.75});
    dimension.spawnParticle("tcsmp:spell_cast", head, vars);

    const key = itemStack.getDynamicPropertyIds()[0];
    const location = itemStack.getDynamicProperty(key);

    source.playSound("waystone.teleport");
    source.camera.fade({
        fadeColor: {red: 0.914, green: 0.882, blue: 0.851},
        fadeTime: {
            fadeInTime: 0.0,
            holdTime: 1.0,
            fadeOutTime: 0.8
        }
    });
    source.teleport(location);
}

/** @param {ItemComponentUseOnEvent} event */
function linkReturnSpell(event) {
    const {block, source} = event, {dimension, location, typeId} = block;
    if (!block.hasTag("tcsmp:waystone")) return;
    const waystone = findWaystone(world, location, typeId) ?? findWaystone(source, location, typeId);
    if (!waystone) return source.sendMessage({translate: "info.return_scroll.private_waystone"});
    const item = source.inventory.container.getSlot(source.selectedSlotIndex);
    item.setLore([`Waystone "${waystone.name}"`]);
    item.clearDynamicProperties();
    item.setDynamicProperty(typeId, location);
    dimension.playSound("scroll.link", source.getHeadLocation());
    source.sendMessage({translate: "info.return_scroll.linked", with: [waystone.name]});
}
