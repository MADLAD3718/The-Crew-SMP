import { Player, system, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";
import block_components from "./block_components/export";
import item_components from "./item_components/export";
import custom_commands from "./custom_commands/export";
import custom_command_enums from "./custom_commands/enums";
import { FactionRegistry } from "./systems/factions";
import { NameRegistry } from "./systems/names";
import "./entity_events/export";
import "./block_events/export";
import "./player_movement/export";
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
});

world.afterEvents.playerSpawn.subscribe(event => {
    const { initialSpawn, player } = event;
    if (!initialSpawn) return;
    
    player.setDynamicProperty("tcsmp:faction_invite");
    NameRegistry.setName(player.id, player.name);

    const faction = FactionRegistry.getFaction(player);
    if (faction)
        player.nameTag = player.name + `\n§${faction.colour}${faction.name}§r`;
    else player.nameTag = player.name;
});

system.afterEvents.scriptEventReceive.subscribe(event => {
    switch (event.id) {
        case "tcsmp:showdp":
            for (const id of world.getDynamicPropertyIds()) {
                let output = world.getDynamicProperty(id);
                if (Vec3.isVector3(output))
                    output = Vec3.toString(output);
                console.warn(`${id}: ${output}`);
            }
            break;
        case "tcsmp:cleardp":
            for (const id of world.getDynamicPropertyIds())
                world.setDynamicProperty(id);
            break;
        case "tcsmp:showdim":
            console.warn(event.sourceEntity?.dimension.id);
            break;
        case "tcsmp:dseats":
            for (const entity of event.sourceEntity?.dimension.getEntities({type: "tcsmp:grappling_hook_seat"}) ?? [])
                entity.remove();
            break;
        case "tcsmp:itemtags":
            const item = event.sourceEntity?.inventory?.container.getSlot((event.sourceEntity as Player).selectedSlotIndex);
            console.warn(item?.getTags());
            break;
    }
});