import { CommandPermissionLevel, CustomCommand, CustomCommandOrigin, CustomCommandResult, CustomCommandStatus, Player } from "@minecraft/server";

const blockInfoCommand: CustomCommand = {
    name: "tcsmp:blockinfo",
    description: "Displays information about the block currently being looked at.",
    permissionLevel: CommandPermissionLevel.Admin,
    cheatsRequired: true
};

function blockInfoCallback(origin: CustomCommandOrigin): CustomCommandResult {
    const player = origin.sourceEntity as Player;
    const block = player.getBlockFromViewDirection({
        includePassableBlocks: true,
        includeLiquidBlocks: true,
        maxDistance: 6
    })?.block;

    if (!block) return {
        message: "Could not find block.",
        status: CustomCommandStatus.Failure
    };

    let message = `Block: §7${block.typeId}§r`;

    const tags = block.getTags();
    if (tags.length > 0)
        message += `\nTags: §7${tags.join(", ")}§r`;

    const states = block.permutation.getAllStates();
    if (Object.keys(states).length > 0)
        message += `\nStates: §7${Object.entries(states).map(pair => `${pair[0]}: ${pair[1]}`).join(", ")}§r`;

    const components = block.getComponents();
    if (components.length > 0)
        message += `\nComponents: §7${components.map(comp => comp.typeId).join(", ")}§r`;
    
    return {
        message,
        status: CustomCommandStatus.Success
    };
}

export default {command: blockInfoCommand, callback: blockInfoCallback};
