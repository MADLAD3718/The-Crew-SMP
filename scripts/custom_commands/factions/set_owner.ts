import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, Player, system } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";

const factionSetOwnerCommand: CustomCommand = {
    name: "faction:setowner",
    description: "Transfer ownership of your faction.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false,
    mandatoryParameters: [
        {
            name: "faction:player",
            type: CustomCommandParamType.PlayerSelector
        }
    ]
};

function factionSetOwnerCallback(origin: CustomCommandOrigin, players: Player[]): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot transfer faction ownership.`
    };

    if (players.length > 1) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot transfer faction ownership to multiple players.`
    };
    
    const [player] = players;
    const faction = FactionRegistry.getFaction(origin.sourceEntity);
    if (!faction) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot find faction.`
    };

    if (faction.owner != origin.sourceEntity.id) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot transfer ownership of a faction you don't own.`
    };

    if (!faction.players.includes(player.id)) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot transfer faction ownership to a player outside of your faction.`
    };

    system.run(() => {
        FactionRegistry.removeFaction(faction);
        FactionRegistry.addFaction({
            name: faction.name,
            colour: faction.colour,
            owner: player.id,
            players: faction.players
        });
        FactionRegistry.sendMessage(faction, `§e${player.name} is now the faction owner§r`);
    });

    return {
        status: CustomCommandStatus.Success,
        message: `Transfered faction ownership to ${player.name}.`
    };
}

export default {command: factionSetOwnerCommand, callback: factionSetOwnerCallback};
