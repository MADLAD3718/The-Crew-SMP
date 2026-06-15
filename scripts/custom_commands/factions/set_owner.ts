import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, Player, system, world } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";
import Config from "../config";

const factionSetOwnerCommand: CustomCommand = {
    name: "tcsmp:faction_setowner",
    description: "Transfer ownership of your faction.",
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
function factionSetOwnerCallback(origin: CustomCommandOrigin, input: SelectorType): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot transfer faction ownership.`
    };

    const players = (typeof input == "string") ?
        world.getPlayers({name: input}) : input;

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
