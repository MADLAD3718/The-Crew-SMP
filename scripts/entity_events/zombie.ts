import { EntityComponentTypes, ItemStack, Player, system, world } from "@minecraft/server";

world.beforeEvents.entityItemPickup.subscribe(({ entity, item }) => {
    if (!entity.isValid) return;

    const itemStack = item.getComponent(EntityComponentTypes.Item)!.itemStack;
    if (itemStack.typeId == "minecraft:leather_leggings")
        system.run(() => {
            entity.addTag("tcsmp:wearing_leather_leggings");
        });
    else if (itemStack.typeId.endsWith("leggings"))
        system.run(() => {
            entity.removeTag("tcsmp:wearing_leather_leggings");
        });
}, { entityFilter: { type: "minecraft:zombie" } });

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
    if (!deadEntity.isValid || !damageSource.damagingEntity?.isValid ||
        !(damageSource.damagingEntity instanceof Player)) return;

    if (deadEntity.hasTag("tcsmp:wearing_leather_leggings"))
        deadEntity.dimension.spawnItem(
            new ItemStack("tcsmp:music_disc_puma_pants"),
            deadEntity.location
        );
}, { entityTypes: ["minecraft:zombie"] });
