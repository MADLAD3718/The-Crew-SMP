import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, Player } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";

const factionInviteCommand: CustomCommand = {
    name: "faction:invite",
    description: "Invites a player to your faction.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false,
    mandatoryParameters: [
        {
            name: "faction:player",
            type: CustomCommandParamType.PlayerSelector
        }
    ]
};

function factionInviteCallback(origin: CustomCommandOrigin, players: Player[]): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot send faction invites.`
    };

    const faction = FactionRegistry.getFaction(origin.sourceEntity);
    if (!faction) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot find faction.`
    };

    const invited: string[] = [];
    for (const player of players) {
        if (player.id == origin.sourceEntity.id) continue;
        if (FactionRegistry.getFaction(player)) {
            origin.sourceEntity.sendMessage(`§c${player.name} is already in a faction.§r`);
            continue;
        };

        player.sendMessage(`You've been invited to join §${faction.colour}${faction.name}§r. Use §7/faction:join§r to accept.`);
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
