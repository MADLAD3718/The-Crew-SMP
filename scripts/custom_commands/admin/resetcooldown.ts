import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus, ItemComponentTypes, Player, system } from "@minecraft/server";

const resetCooldownCommand: CustomCommand = {
    name: "tcsmp:resetcooldown",
    description: "Reset the cooldown of the currently held item.",
    permissionLevel: CommandPermissionLevel.Admin,
    cheatsRequired: true
};

function resetCooldownCallback(origin: CustomCommandOrigin): CustomCommandResult {
    const player = origin.sourceEntity as Player;
    const itemSlot = player.inventory.container.getSlot(player.selectedSlotIndex);
    const itemStack = itemSlot.getItem();

    if (!itemStack) return {
        message: "Could not find an item to reset cooldown for.",
        status: CustomCommandStatus.Failure
    };

    if (!itemStack.hasComponent(ItemComponentTypes.Cooldown)) return {
        message: `Could not find cooldown for ${itemStack.typeId}.`,
        status: CustomCommandStatus.Failure
    };

    system.run(() => {    
        const cooldown = itemStack.getComponent(ItemComponentTypes.Cooldown)!;
        player.startItemCooldown(cooldown.cooldownCategory, 0);
    });

    return {
        message: `Reset the cooldown of ${itemStack.typeId}`,
        status: CustomCommandStatus.Success
    };
}

export default {command: resetCooldownCommand, callback: resetCooldownCallback};
