import { ItemCustomComponent, world } from "@minecraft/server";

type AutoLoreParameters = {
    lore: string
}

world.afterEvents.playerInventoryItemChange.subscribe(event => {
    const component = event.itemStack?.getComponent("tcsmp:auto_lore");
    if (!component) return;
    const lore_key = (component.customComponentParameters.params as AutoLoreParameters).lore;
    const itemSlot = event.player.inventory.container.getSlot(event.slot);
    itemSlot.setLore([{translate: lore_key}]);
});

const autoLoreComponent: ItemCustomComponent = {};

export default autoLoreComponent;
