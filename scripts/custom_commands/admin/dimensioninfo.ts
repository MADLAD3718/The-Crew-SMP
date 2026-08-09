import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus } from "@minecraft/server";

const dimensionInfoCommand: CustomCommand = {
    name: "tcsmp:dimensioninfo",
    description: "Displays information about the current dimension.",
    permissionLevel: CommandPermissionLevel.Admin,
    cheatsRequired: false
};

function dimensionInfoCallback(origin: CustomCommandOrigin): CustomCommandResult {
    if (!origin.sourceEntity?.isValid) return {
        status: CustomCommandStatus.Failure,
        message: `Non-players cannot request dimension information.`
    };

    const dimension = origin.sourceEntity.dimension;
    return {
        message: `Dimension: §7${dimension.id}§r\nMaximum Height: §7${dimension.heightRange.max}§r\nMinimum Height: §7${dimension.heightRange.min}§r`,
        status: CustomCommandStatus.Success
    };
}

export default { command: dimensionInfoCommand, callback: dimensionInfoCallback };
