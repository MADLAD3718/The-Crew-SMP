import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, Player, system } from "@minecraft/server"
import { FactionColour, FactionRegistry } from "../../systems/factions";

const renameFactionCommand: CustomCommand = {
    name: "tcsmp:faction_rename",
    description: "Renames your faction.",
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

function renameFactionCallback(origin: CustomCommandOrigin, name: string, colour: keyof typeof FactionColour): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot rename factions.`
    };

    const faction = FactionRegistry.getFaction(origin.sourceEntity);
    if (!faction) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot find faction.`
    };

    if (faction.owner != origin.sourceEntity.id) return {
        status: CustomCommandStatus.Failure,
        message: `Unable to rename faction, ownership required.`
    };

    if (name != faction.name && !FactionRegistry.nameIsValid(name)) return {
        status: CustomCommandStatus.Failure,
        message: `Faction name §${FactionColour[colour]}${name}§c is invalid.`
    };

    system.run(() => {
        FactionRegistry.removeFaction(faction);
        FactionRegistry.addFaction({
            name: name,
            colour: FactionColour[colour],
            owner: faction.owner,
            players: faction.players
        });
    });
    
    return {
        status: CustomCommandStatus.Success,
        message: `Renamed faction to §${FactionColour[colour]}${name}§r.`
    };
}

export default {command: renameFactionCommand, callback: renameFactionCallback};
