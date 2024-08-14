import { world } from "@minecraft/server";

world.afterEvents.dataDrivenEntityTrigger.subscribe(event => {
    const {entity, eventId} = event;
    if (eventId !== "tcsmp:remove_charge") return;
    entity.dimension.playSound("bottle.lightning", entity.location);
});
