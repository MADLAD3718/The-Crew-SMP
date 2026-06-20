import { Vec3 } from "@madlad3718/mcveclib";
import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, world } from "@minecraft/server";

export enum DynamicPropertiesAction {
    List = "list",
    Clear = "clear"
}

const dynamicPropertiesCommand: CustomCommand = {
    name: "tcsmp:dynamicproperties",
    description: "Manages the dynamic properties stored in the world.",
    permissionLevel: CommandPermissionLevel.Admin,
    cheatsRequired: true,
    mandatoryParameters: [
        {
            name: "tcsmp:dynamicproperties_action",
            type: CustomCommandParamType.Enum
        }
    ]
}

function dynamicPropertiesCallback(origin: CustomCommandOrigin, action: DynamicPropertiesAction): CustomCommandResult {
    const propertyIds = world.getDynamicPropertyIds();
    if (propertyIds.length == 0) return {
        message: "No world dynamic properties currently stored.",
        status: CustomCommandStatus.Success
    };

    let message: string;
    switch (action) {
        case DynamicPropertiesAction.List:
            message = `Dynamic Properties:\n§7${propertyIds.map(id => {
                const value = world.getDynamicProperty(id);
                const output = Vec3.isVector3(value) ? Vec3.toString(value) : value;
                return `${id}: ${output}`;
            }).join('\n')}§r`;
            break;
        case DynamicPropertiesAction.Clear:
            message = "Cleared all world dynamic properties.";
            world.clearDynamicProperties();
            break;
    }

    return {
        message,
        status: CustomCommandStatus.Success
    };
}

export default {command: dynamicPropertiesCommand, callback: dynamicPropertiesCallback};
