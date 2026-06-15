import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, Player, system, world } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";
import Config from "../config";

const factionKickCommand: CustomCommand = {
    name: "tcsmp:faction_kick",
    description: "Kicks a player from your faction.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false,
    mandatoryParameters: [
        {
            name: Config.use_string_selectors ? 
                "playerName" : "player",
            type: Config.use_string_selectors ?
                CustomCommandParamType.String :
                CustomCommandParamType.PlayerSelector
        }
    ]
};

type SelectorType = (typeof Config.use_string_selectors) extends true ? string : Player[];
function factionKickCallback(origin: CustomCommandOrigin, input: SelectorType): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot create factions.`
    };

    const faction = FactionRegistry.getFaction(origin.sourceEntity);
    if (!faction) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot find faction.`
    };

    if (faction.owner != origin.sourceEntity.id) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot kick players, ownership required.`
    }

    const players = (typeof input == "string") ?
        world.getPlayers({name: input}) : input;

    const kicked: string[] = [];
    for (const player of players) {
        if (!(faction.players.includes(player.id))) {
            origin.sourceEntity.sendMessage(`§e${player.name} is not in your faction.§r`);
            continue;
        }
        if (faction.owner == player.id) {
            origin.sourceEntity.sendMessage(`§cCannot kick owner from faction.§r`);
            continue;
        }

        player.sendMessage(`You have been kicked from §${faction.colour}${faction.name}§r.`);
        // Name tags can't be edited in restricted execution mode
        system.run(() => {
            FactionRegistry.removePlayer(faction, player.id);
        });
        kicked.push(player.name);
    }

    if (kicked.length) return {
        status: CustomCommandStatus.Success,
        message: `Successfully kicked ${kicked}.`
    };
    else return {
        status: CustomCommandStatus.Failure,
        message: `Could not kick any players.`
    };
}

export default {command: factionKickCommand, callback: factionKickCallback};
