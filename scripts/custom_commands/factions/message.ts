import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, Player } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";

const factionMessageCommand: CustomCommand = {
    name: "tcsmp:messagefaction",
    description: "Send a message to your faction.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false,
    mandatoryParameters: [
        {
            name: "message",
            type: CustomCommandParamType.String
        }
    ]
};

function factionMessageCallback(origin: CustomCommandOrigin, message: string): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot send faction messages.`
    };

    const faction = FactionRegistry.getFaction(origin.sourceEntity);
    if (!faction) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot find faction.`
    };
    
    FactionRegistry.sendMessage(faction, `<${origin.sourceEntity.name}> ${message}`);

    return {
        status: CustomCommandStatus.Success
    };
}

export default {command: factionMessageCommand, callback: factionMessageCallback};
