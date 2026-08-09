import { ItemComponentTypes, ItemCustomComponent, world } from "@minecraft/server";

const globalCooldownComponent: ItemCustomComponent = {
    onUse(event) {
        const cooldown = event.itemStack?.getComponent(ItemComponentTypes.Cooldown);
        for (const player of world.getAllPlayers())
            if (player.isValid) cooldown?.startCooldown(player);
    }
};

export default globalCooldownComponent;
