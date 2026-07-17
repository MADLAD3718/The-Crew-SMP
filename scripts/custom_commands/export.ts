import { CustomCommand, CustomCommandOrigin, CustomCommandResult } from "@minecraft/server";
import biomeInfoCommand from "./admin/biomeinfo";
import blockInfoCommand from "./admin/blockinfo";
import damageItemCommand from "./admin/damageitem";
import dimensionInfoCommand from "./admin/dimensioninfo";
import dynamicPropertiesCommand from "./admin/dynamicproperties";
import itemInfoCommand from "./admin/iteminfo";
import removeEntityCommand from "./admin/removeentity";
import resetCooldownCommand from "./admin/resetcooldown";
import serverModeCommand from "./admin/servermode";
import listAuraCommand from "./aura/listaura";
import toggleAuraCommand from "./aura/toggleaura";
import factionCreateCommand from "./factions/create";
import factionDeleteCommand from "./factions/delete";
import factionInviteCommand from "./factions/invite";
import factionJoinCommand from "./factions/join";
import factionKickCommand from "./factions/kick";
import factionLeaveCommand from "./factions/leave";
import factionListCommand from "./factions/list";
import factionMessageCommand from "./factions/message";
import factionRenameCommand from "./factions/rename";
import factionTransferCommand from "./factions/transfer";

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
    resetCooldownCommand,
    removeEntityCommand,
    serverModeCommand,
    toggleAuraCommand,
    listAuraCommand
];

export default CustomCommands;
