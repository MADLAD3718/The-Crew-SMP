import { EntityComponentTypes, EntityDamageCause, ItemStack, world } from "@minecraft/server";

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
    if (damageSource.cause != EntityDamageCause.fall) return;
    if (!deadEntity.hasComponent(EntityComponentTypes.IsBaby)) return;
    deadEntity.dimension.spawnItem(
        new ItemStack("tcsmp:music_disc_drop_it"),
        deadEntity.location
    );
}, { entityTypes: ["minecraft:villager_v2"] });
