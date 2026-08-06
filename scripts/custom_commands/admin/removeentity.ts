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
    for (const entity of entities) system.run(() => {
        entity.remove();
    });
    return {
        message: `Successfully removed ${entities.length} entit${entities.length === 1 ? 'y' : "ies"}.`,
        status: CustomCommandStatus.Success
    }
}

export default { command: removeEntityCommand, callback: removeEntityCallback };
