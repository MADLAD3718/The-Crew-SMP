import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus, Player } from "@minecraft/server";

const itemInfoCommand: CustomCommand = {
    name: "tcsmp:iteminfo",
    description: "Displays information about the currently held item.",
    permissionLevel: CommandPermissionLevel.Admin,
    cheatsRequired: true
};

function itemInfoCallback(origin: CustomCommandOrigin): CustomCommandResult {
    const player = origin.sourceEntity as Player;
    const itemStack = player.inventory.container.getItem(player.selectedSlotIndex);

    if (!itemStack) return {
        message: "Could not find item.",
        status: CustomCommandStatus.Failure
    };

    let message = `Item: §7${itemStack.typeId}§r`;

    const tags = itemStack.getTags();
    if (tags.length > 0)
        message += `\nTags: §7${tags.join(", ")}§r`;

    const components = itemStack.getComponents();
    if (components.length > 0)
        message += `\nComponents: §7${components.map(comp => comp.typeId).join(", ")}§r`;

    return {
        message,
        status: CustomCommandStatus.Success
    };
}

export default {command: itemInfoCommand, callback: itemInfoCallback};
