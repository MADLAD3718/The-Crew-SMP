import { Vec3 } from "@madlad3718/mcveclib";
import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandParamType, CustomCommandResult, CustomCommandStatus, world } from "@minecraft/server";

export enum DynamicPropertiesAction {
    List = "list",
    Clear = "clear"
}

export enum DynamicPropertiesField {
    Self = "self",
    World = "world"
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
        },
        {
            name: "tcsmp:dynamicproperties_field",
            type: CustomCommandParamType.Enum
        }
    ]
}

function dynamicPropertiesCallback(origin: CustomCommandOrigin, action: DynamicPropertiesAction, field: DynamicPropertiesField): CustomCommandResult {
    const medium = field === DynamicPropertiesField.Self ? origin.sourceEntity! : world;

    const propertyIds = medium.getDynamicPropertyIds();
    if (propertyIds.length === 0) return {
        message: `No ${field} dynamic properties currently stored.`,
        status: CustomCommandStatus.Success
    };

    let message: string;
    switch (action) {
        case DynamicPropertiesAction.List:
            message = `Dynamic Properties:\n§7${propertyIds.map(id => {
                const value = medium.getDynamicProperty(id);
                const output = Vec3.isVector3(value) ? Vec3.toString(value) : value;
                return `${id}: ${output}`;
            }).join('\n')}§r`;
            break;
        case DynamicPropertiesAction.Clear:
            message = `Cleared all ${field} dynamic properties.`;
            medium.clearDynamicProperties();
            break;
    }

    return {
        message,
        status: CustomCommandStatus.Success
    };
}

export default { command: dynamicPropertiesCommand, callback: dynamicPropertiesCallback };
