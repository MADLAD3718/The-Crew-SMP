import { system, Vector3, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";
import block_components from "./block_components/export";
import item_components from "./item_components/export";
import "./entity_events/export";
import "./extensions/export";

world.beforeEvents.worldInitialize.subscribe(({blockComponentRegistry, itemComponentRegistry}) => {
    for (const register of item_components)
        itemComponentRegistry.registerCustomComponent(register.name, register.component);
    
    for (const register of block_components)
        blockComponentRegistry.registerCustomComponent(register.name, register.component);
});

system.afterEvents.scriptEventReceive.subscribe(event => {
    switch (event.id) {
        case "tcsmp:showdp":
            for (const id of world.getDynamicPropertyIds())
                console.warn(`${id}: ${Vec3.toString(world.getDynamicProperty(id) as Vector3)}`);
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