import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, Player, world } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";
import Config from "../config";

const factionInviteCommand: CustomCommand = {
    name: "tcsmp:faction_invite",
    description: "Invites a player to your faction.",
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
function factionInviteCallback(origin: CustomCommandOrigin, input: SelectorType): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot send faction invites.`
    };

    const faction = FactionRegistry.getFaction(origin.sourceEntity);
    if (!faction) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot find faction.`
    };

    const players = (typeof input == "string") ?
        world.getPlayers({name: input}) : input;

    const invited: string[] = [];
    for (const player of players) {
        if (player.id == origin.sourceEntity.id) continue;
        if (FactionRegistry.getFaction(player)) {
            origin.sourceEntity.sendMessage(`§c${player.name} is already in a faction.§r`);
            continue;
        };

        player.sendMessage(`You've been invited to join §${faction.colour}${faction.name}§r. Use §7/faction_join§r to accept.`);
        FactionRegistry.invitePlayer(faction, player);

        invited.push(player.name);
    }

    if (invited.length) return {
        status: CustomCommandStatus.Success,
        message: `Successfully sent faction invite${invited.length > 1 ? 's' : ''} to ${invited}.`
    };
    else return {
        status: CustomCommandStatus.Failure,
        message: `Could not send any faction invites.`
    };
}

export default {command: factionInviteCommand, callback: factionInviteCallback};
