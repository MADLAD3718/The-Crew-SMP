import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus, Player, system, world } from "@minecraft/server";

const queryAuraCommand: CustomCommand = {
    name: "tcsmp:queryaura",
    description: "Displays your current aura value.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false
};

function queryAuraCallback(origin: CustomCommandOrigin): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: "Non-players cannot possess an aura score."
    };

    const auraScore = origin.sourceEntity.getDynamicProperty("aura") as number;

    return {
        status: CustomCommandStatus.Success,
        message: `You currently have ${auraScore} Aura.`
    };
}

export default { command: queryAuraCommand, callback: queryAuraCallback };
