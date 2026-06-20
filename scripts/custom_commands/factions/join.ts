import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus, Player, system } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";

const factionJoinCommand: CustomCommand = {
    name: "tcsmp:joinfaction",
    description: "Accepts the most recent invite to a faction.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false
};

function factionJoinCallback(origin: CustomCommandOrigin): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot send faction invites.`
    };

    const currentFaction = FactionRegistry.getFaction(origin.sourceEntity);
    if (currentFaction) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot join multiple factions.`
    };

    const targetFaction = FactionRegistry.getFaction(origin.sourceEntity.getDynamicProperty("tcsmp:faction_invite") as string);
    if (!targetFaction) return {
        status: CustomCommandStatus.Failure,
        message: `Invited faction no longer exists.`
    };

    system.run(() => {
        FactionRegistry.sendMessage(targetFaction, `§e${(origin.sourceEntity as Player).name} has joined the faction`);
        FactionRegistry.addPlayer(targetFaction, origin.sourceEntity!.id);
        origin.sourceEntity!.setDynamicProperty("tcsmp:faction_invite");
    });

    return {
        status: CustomCommandStatus.Success,
        message: `You have joined faction §${targetFaction.colour}${targetFaction.name}§r.`
    };
}

export default {command: factionJoinCommand, callback: factionJoinCallback};
