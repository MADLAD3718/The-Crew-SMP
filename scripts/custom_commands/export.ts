import { CustomCommand, CustomCommandOrigin, CustomCommandResult } from "@minecraft/server";
import factionSetOwnerCommand from "./factions/set_owner";
import factionMessageCommand from "./factions/message";
import factionCreateCommand from "./factions/create";
import factionRenameCommand from "./factions/rename";
import factionInviteCommand from "./factions/invite";
import factionDeleteCommand from "./factions/delete";
import factionLeaveCommand from "./factions/leave";
import factionJoinCommand from "./factions/join";
import factionKickCommand from "./factions/kick";

type CustomCommandRegister = {
    command: CustomCommand,
    callback: (origin: CustomCommandOrigin, ...args: any[]) => CustomCommandResult | undefined
}

const CustomCommands: CustomCommandRegister[] = [
    factionCreateCommand,
    factionRenameCommand,
    factionInviteCommand,
    factionLeaveCommand,
    factionSetOwnerCommand,
    factionDeleteCommand,
    factionMessageCommand,
    factionJoinCommand,
    factionKickCommand
];

export default CustomCommands;
