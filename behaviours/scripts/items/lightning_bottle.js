import { world } from "@minecraft/server";

world.afterEvents.dataDrivenEntityTrigger.subscribe(({entity}) => {
    entity.dimension.playSound("bottle.lightning", entity.location);
}, { eventTypes: ["tcsmp:remove_charge"]});
