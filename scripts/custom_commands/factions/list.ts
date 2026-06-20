import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus, Player } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";
import { NameRegistry } from "../../systems/names";

const factionListCommand: CustomCommand = {
    name: "tcsmp:listfaction",
    description: "Lists the players currently in your faction.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false
}

function factionListCallback(origin: CustomCommandOrigin): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot list faction members.`
    };

    const faction = FactionRegistry.getFaction(origin.sourceEntity);
    if (!faction) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot find faction.`
    };

    let message = `There are ${faction.players.length} players in §${faction.colour}${faction.name}§r:\n`;
    message += faction.players.reduce((prev, cur) => {
        let display = NameRegistry.getName(cur);
        if (faction.owner == cur) return prev;
        return prev + ", " + display;
    }, NameRegistry.getName(faction.owner) + " (Owner)");

    return {
        status: CustomCommandStatus.Success, message
    };
}

export default {command: factionListCommand, callback: factionListCallback};
