import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, Player, system } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";

const factionKickCommand: CustomCommand = {
    name: "faction:kick",
    description: "Kicks a player from your faction.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false,
    mandatoryParameters: [
        {
            name: "faction:player",
            type: CustomCommandParamType.PlayerSelector
        }
    ]
};

function factionKickCallback(origin: CustomCommandOrigin, players: Player[]): CustomCommandResult {
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
