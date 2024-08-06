import { EntityComponentTypes, GameMode, ItemStack, world } from "@minecraft/server";

world.afterEvents.entityHitEntity.subscribe(event => {
    const {hitEntity: cannon, damagingEntity} = event;
    if (cannon.typeId !== "tcsmp:cannon") return;

    const rider = cannon.getComponent(EntityComponentTypes.Rideable).getRiders()[0];
    if (rider?.id === damagingEntity.id) {
        console.warn(`Fire!`);
    } else {
        if (damagingEntity?.getGameMode() !== GameMode.creative)
            cannon.dimension.spawnItem(new ItemStack("tcsmp:cannon"), cannon.location);
        cannon.remove();
    }
});

world.afterEvents.dataDrivenEntityTrigger.subscribe(event => {
    if (event.eventId !== "tcsmp:control_cannon") return;
    const {entity: cannon} = event;
    const player = cannon.getComponent(EntityComponentTypes.Rideable).getRiders()[0];
});
