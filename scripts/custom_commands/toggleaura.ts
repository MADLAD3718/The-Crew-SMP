import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus, Player, system, world } from "@minecraft/server";

const toggleAuraCommand: CustomCommand = {
    name: "tcsmp:toggleaura",
    description: "Toggles display of the aura meter.",
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false
};

function toggleAuraCallback(origin: CustomCommandOrigin): CustomCommandResult {
    if (!(origin.sourceEntity instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: "Non-players cannot possess an aura score."
    };

    const aura = world.scoreboard.getObjective("aura")!;
    const displayState = aura.hasParticipant(origin.sourceEntity!);

    system.run(() => {
        if (displayState) aura.removeParticipant(origin.sourceEntity!);
        else {
            const auraScore = origin.sourceEntity!.getDynamicProperty("aura") as number;
            aura.setScore(origin.sourceEntity!, auraScore);
        }
    });

    return {
        status: CustomCommandStatus.Success,
        message: `Aura meter visibility has been set to ${!displayState}.`
    };
}

export default { command: toggleAuraCommand, callback: toggleAuraCallback };
