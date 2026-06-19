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

system.afterEvents.scriptEventReceive.subscribe(event => {
    const player = event.sourceEntity;
    if (!(player instanceof Player)) return;
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
            console.warn(player.dimension.id);
            break;
        case "tcsmp:dseats":
            for (const entity of player.dimension.getEntities({type: "tcsmp:grappling_hook_seat"}) ?? [])
                entity.remove();
            break;
        case "tcsmp:itemtags":
            const item = player.inventory.container.getSlot(player.selectedSlotIndex);
            console.warn(item?.getTags());
            break;
        case "tcsmp:blockinfo":
            const block = player.getBlockFromViewDirection({includeLiquidBlocks: true, includePassableBlocks: true});
            console.warn(`Tags: ${block?.block.getTags()}`);
            const components = block?.block.getComponents();
            const componentIds = components?.map(component => component.typeId);
            console.warn(`Components: ${componentIds}`);
            const states = block?.block.permutation.getAllStates();
            const stateIds = Object.keys(states!);
            console.warn(`States: ${stateIds}`);
            break;
        case "tcsmp:damage":
            const itemToDamage = player.inventory.container.getSlot(player.selectedSlotIndex);
            const itemStack = itemToDamage.getItem();
            itemToDamage.setItem(itemStack?.damage((itemStack.durability?.maxDurability ?? 0) * 6/13));
            console.warn(`Damaged ${itemStack?.typeId}`);
            break;
        case "tcsmp:biometags":
            const biome = player.dimension.getBiome(player.location);
            console.warn(`Biome: ${biome.id}`, `\nTags: ${biome.getTags()}`);
            break;
    }
});
