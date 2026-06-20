import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus } from "@minecraft/server";

const biomeInfoCommand: CustomCommand = {
    name: "tcsmp:biomeinfo",
    description: "Displays information about the current biome.",
    permissionLevel: CommandPermissionLevel.Admin,
    cheatsRequired: false
};

function biomeInfoCallback(origin: CustomCommandOrigin): CustomCommandResult {
    const biome = origin.sourceEntity!.dimension.getBiome(origin.sourceEntity!.location);
    return {
        message: `Biome: §7${biome.id}§r\nTags: §7${biome.getTags().join(", ")}§r`,
        status: CustomCommandStatus.Success
    };
}

export default {command: biomeInfoCommand, callback: biomeInfoCallback};
