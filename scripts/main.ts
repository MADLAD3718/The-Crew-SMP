import { system, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";
import block_components from "./block_components/export";
import item_components from "./item_components/export";
import { FactionRegistry } from "./systems/factions";
import { NameRegistry } from "./systems/names";
import "./entity_events/export";
import "./extensions/export";

world.beforeEvents.worldInitialize.subscribe(({blockComponentRegistry, itemComponentRegistry}) => {
    for (const register of item_components)
        itemComponentRegistry.registerCustomComponent(register.name, register.component);
    
    for (const register of block_components)
        blockComponentRegistry.registerCustomComponent(register.name, register.component);
});

world.afterEvents.playerSpawn.subscribe(event => {
    const { initialSpawn, player } = event;
    if (!initialSpawn) return;
    
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
    }
});