import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, Player, system } from "@minecraft/server";
import { FactionColour, FactionRegistry } from "../../systems/factions";

const createFactionCommand: CustomCommand = {
    name: "tcsmp:createfaction",
    description: "Creates a new faction.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false,
    mandatoryParameters: [
        {
            name: "name",
            type: CustomCommandParamType.String
        },
        {
            name: "tcsmp:faction_colour",
            type: CustomCommandParamType.Enum
        }
    ]
};

function createFactionCallback(origin: CustomCommandOrigin, name: string, colour: keyof typeof FactionColour): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot create factions.`
    };

    if (FactionRegistry.getFaction(origin.sourceEntity)) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot create a faction while already part of one.`
    };

    if (!FactionRegistry.nameIsValid(name)) return {
        status: CustomCommandStatus.Failure,
        message: `Faction name ${name} is invalid.`
    };

    system.run(() => FactionRegistry.addFaction({
        name: name,
        colour: FactionColour[colour],
        owner: origin.sourceEntity!.id,
        players: [origin.sourceEntity!.id]
    }));
    
    return {
        status: CustomCommandStatus.Success,
        message: `Successfully created faction §${FactionColour[colour]}${name}§r.`
    };
}

export default {command: createFactionCommand, callback: createFactionCallback};