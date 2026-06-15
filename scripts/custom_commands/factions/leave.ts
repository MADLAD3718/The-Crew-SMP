import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus, Player, system } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";

const factionLeaveCommand: CustomCommand = {
    name: "tcsmp:faction_leave",
    description: "Leave your current faction.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false
};

function factionLeaveCallback(origin: CustomCommandOrigin): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: "Non-player entities cannot leave factions."
    };

    const faction = FactionRegistry.getFaction(origin.sourceEntity);
    if (!faction) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot find faction.`
    };

    if (faction.owner == origin.sourceEntity.id) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot leave a faction you own.`
    };

    system.run(() => {
        FactionRegistry.removePlayer(faction, origin.sourceEntity!.id);
    });

    return {
        status: CustomCommandStatus.Success,
        message: `You are no longer in faction §${faction.colour}${faction.name}§r.`
    };
}

export default {command: factionLeaveCommand, callback: factionLeaveCallback};
