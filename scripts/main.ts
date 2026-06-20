import { PersistentCooldowns } from "./systems/persistent_cooldowns";
import custom_command_enums from "./custom_commands/enums";
import { Player, system, world } from "@minecraft/server";
import block_components from "./block_components/export";
import item_components from "./item_components/export";
import custom_commands from "./custom_commands/export";
import { WaypointManager } from "./systems/waypoints";
import { FactionRegistry } from "./systems/factions";
import { NameRegistry } from "./systems/names";
import { Vec3 } from "@madlad3718/mcveclib";
import "./player_movement/export";
import "./entity_events/export";
import "./block_events/export";
import "./extensions/export";

system.beforeEvents.startup.subscribe(({blockComponentRegistry, itemComponentRegistry, customCommandRegistry}) => {
    for (const register of item_components)
        itemComponentRegistry.registerCustomComponent(register.name, register.component);
    
    for (const register of block_components)
        blockComponentRegistry.registerCustomComponent(register.name, register.component);

    for (const register of custom_command_enums)
        customCommandRegistry.registerEnum(register.name, register.values);

    for (const register of custom_commands)
        customCommandRegistry.registerCommand(register.command, register.callback);

    PersistentCooldowns.register("spell");
});

world.afterEvents.playerSpawn.subscribe(event => {
    const { initialSpawn, player } = event;
    if (!initialSpawn) return;
    
    player.setDynamicProperty("tcsmp:faction_invite");
    NameRegistry.setName(player.id, player.name);

    const faction = FactionRegistry.getFaction(player);
    if (faction) {
        player.nameTag = player.name + `\n§${faction.colour}${faction.name}§r`;
        WaypointManager.refreshFactionWaypoints();
    }

    player.removeTag("tcsmp:is_being_dragged");
});
