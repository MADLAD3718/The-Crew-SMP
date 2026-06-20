import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, ItemComponentTypes, Player, system } from "@minecraft/server";

const damageItemCommand: CustomCommand = {
    name: "tcsmp:damageitem",
    description: "Applies durability damage to the currently held item.",
    permissionLevel: CommandPermissionLevel.Admin,
    cheatsRequired: true,
    optionalParameters: [
        {
            name: "amount",
            type: CustomCommandParamType.Integer
        }
    ]
};

function damageItemCallback(origin: CustomCommandOrigin, amount: number): CustomCommandResult {
    const player = origin.sourceEntity as Player;
    const itemToDamage = player.inventory.container.getSlot(player.selectedSlotIndex);
    const itemStack = itemToDamage.getItem();

    if (!itemStack) return {
        message: "Could not find an item to damage.",
        status: CustomCommandStatus.Failure
    };

    if (!itemStack.hasComponent(ItemComponentTypes.Durability)) return {
        message: `Could not damage ${itemStack.typeId}.`,
        status: CustomCommandStatus.Failure
    };

    system.run(() => {
        const damagedItem = itemStack.damage(amount);
        itemToDamage.setItem(damagedItem);
    
        if (!damagedItem) player.dimension.playSound(
            "random.break",
            player.getHeadLocation(),
            { pitch: 0.9 }
        );
    });

    return {
        message: `Applied ${amount} damage to ${itemStack.typeId}.`,
        status: CustomCommandStatus.Success
    };
}

export default {command: damageItemCommand, callback: damageItemCallback};
