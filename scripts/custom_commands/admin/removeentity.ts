import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, Entity, system } from "@minecraft/server";

const removeEntityCommand: CustomCommand = {
    name: "tcsmp:removeentity",
    description: "Removes an entity from the world.",
    permissionLevel: CommandPermissionLevel.Admin,
    cheatsRequired: true,
    mandatoryParameters: [
        {
            name: "entity",
            type: CustomCommandParamType.EntitySelector
        }
    ]
}

function removeEntityCallback(origin: CustomCommandOrigin, entities: Entity[]): CustomCommandResult {
    let count = 0;
    for (const entity of entities) {
        system.run(() => {
            entity.remove()
        });
        ++count;
    }
    return {
        message: `Removed ${count} entit${count == 1 ? 'y' : "ies"}.`,
        status: CustomCommandStatus.Success
    }
}

export default {command: removeEntityCommand, callback: removeEntityCallback};
