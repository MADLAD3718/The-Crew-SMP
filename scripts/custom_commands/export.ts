import { CustomCommand, CustomCommandOrigin, CustomCommandResult } from "@minecraft/server";
import factionTransferCommand from "./factions/transfer";
import factionMessageCommand from "./factions/message";
import factionCreateCommand from "./factions/create";
import factionRenameCommand from "./factions/rename";
import factionInviteCommand from "./factions/invite";
import factionDeleteCommand from "./factions/delete";
import factionLeaveCommand from "./factions/leave";
import factionJoinCommand from "./factions/join";
import factionKickCommand from "./factions/kick";
import factionListCommand from "./factions/list";
import dynamicPropertiesCommand from "./admin/dynamicproperties";
import dimensionInfoCommand from "./admin/dimensioninfo";
import resetCooldownCommand from "./admin/resetcooldown";
import damageItemCommand from "./admin/damageitem";
import biomeInfoCommand from "./admin/biomeinfo";
import blockInfoCommand from "./admin/blockinfo";
import itemInfoCommand from "./admin/iteminfo";

type CustomCommandRegister = {
    command: CustomCommand,
    callback: (origin: CustomCommandOrigin, ...args: any[]) => CustomCommandResult | undefined
}

const CustomCommands: CustomCommandRegister[] = [
    factionCreateCommand,
    factionRenameCommand,
    factionInviteCommand,
    factionLeaveCommand,
    factionTransferCommand,
    factionDeleteCommand,
    factionMessageCommand,
    factionJoinCommand,
    factionKickCommand,
    factionListCommand,
    biomeInfoCommand,
    damageItemCommand,
    blockInfoCommand,
    itemInfoCommand,
    dimensionInfoCommand,
    dynamicPropertiesCommand,
    resetCooldownCommand
];

export default CustomCommands;
