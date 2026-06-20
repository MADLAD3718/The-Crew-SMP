import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus } from "@minecraft/server";

const dimensionInfoCommand: CustomCommand = {
    name: "tcsmp:dimensioninfo",
    description: "Displays information about the current dimension.",
    permissionLevel: CommandPermissionLevel.Admin,
    cheatsRequired: false
};

function dimensionInfoCallback(origin: CustomCommandOrigin): CustomCommandResult {
    const dimension = origin.sourceEntity!.dimension;
    dimension.heightRange
    return {
        message: `Dimension: §7${dimension.id}§r\nMaximum Height: §7${dimension.heightRange.max}§r\nMinimum Height: §7${dimension.heightRange.min}§r`,
        status: CustomCommandStatus.Success
    };
}

export default {command: dimensionInfoCommand, callback: dimensionInfoCallback};
