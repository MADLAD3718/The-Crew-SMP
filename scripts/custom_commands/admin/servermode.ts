import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, world } from "@minecraft/server";

const serverModeCommand: CustomCommand = {
    name: "tcsmp:servermode",
    description: "Whether scripts should execute as if they are in a bedrock dedicated server environment.",
    permissionLevel: CommandPermissionLevel.Admin,
    cheatsRequired: true,
    optionalParameters: [
        {
            name: "value",
            type: CustomCommandParamType.Boolean
        }
    ]
};

function serverModeCallback(origin: CustomCommandOrigin, value?: boolean): CustomCommandResult {
    if (!(typeof value === "boolean")) return {
        status: CustomCommandStatus.Success,
        message: `servermode = ${world.getDynamicProperty("servermode") ?? false}`
    };

    world.setDynamicProperty("servermode", value);
    
    return {
        status: CustomCommandStatus.Success,
        message: `Script rule servermode has been updated to ${value}`
    };
}

export default { command: serverModeCommand, callback: serverModeCallback };