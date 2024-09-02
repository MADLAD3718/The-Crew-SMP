import { Player, world } from "@minecraft/server";
import "../extensions/entities";

world.afterEvents.entitySpawn.subscribe(event => {
    const {entity} = event;
    if (entity.typeId !== "minecraft:arrow") return;
    const {dimension, projectile} = entity
    if (!(projectile.owner instanceof Player)) return;

    const player = projectile.owner;
    const bow = player.inventory.container.getSlot(player.selectedSlotIndex);
    if (bow.typeId !== "tcsmp:cannabis_bow") return;

    const arrow = dimension.spawnEntity("tcsmp:cannabis_arrow", entity.location);
    arrow.projectile.owner = player;
    arrow.projectile.shoot(entity.getVelocity());
    entity.remove();
});
