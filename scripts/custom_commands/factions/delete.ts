import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus, Player, system } from "@minecraft/server";
import { FactionRegistry } from "../../systems/factions";

const factionDeleteCommand: CustomCommand = {
    name: "tcsmp:faction_delete",
    description: "Deletes your faction.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false
};

function factionDeleteCallback(origin: CustomCommandOrigin): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: `Non-player entities cannot send faction invites.`
    };

    const faction = FactionRegistry.getFaction(origin.sourceEntity);
    if (!faction) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot find faction.`
    };

    if (faction.owner != origin.sourceEntity.id) return {
        status: CustomCommandStatus.Failure,
        message: `Cannot delete faction, ownership required.`
    }

    system.run(() => {
        FactionRegistry.removeFaction(faction);
    });

    return {
        status: CustomCommandStatus.Success,
        message: `Deleted faction §${faction.colour}${faction.name}§r.`
    };
}

export default {command :factionDeleteCommand, callback: factionDeleteCallback};
