import { EntityComponentTypes, EquipmentSlot, world } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { Vec3 } from "@madlad3718/mcveclib";

world.afterEvents.playerInteractWithEntity.subscribe(event => {
    const { player, target } = event;

    if (!target.isValid ||
        !target.matches({type: MinecraftEntityTypes.Wolf}) ||
        !target.hasComponent(EntityComponentTypes.IsTamed) ||
        player.equipment.getEquipment(EquipmentSlot.Mainhand) ||
        Vec3.distance(player.location, target.location) > 1.5 ||
        !player.isSneaking
    ) return;

    const { dimension } = player;
    dimension.playSound("wolf.pet", target.location);

    const variant = target.getProperty("minecraft:sound_variant");
    const sound = variant == "default" ? "mob.wolf.bark" : `mob.wolf.${variant}.bark`;
    dimension.playSound(sound, target.location);

    dimension.spawnParticle("minecraft:heart_particle", Vec3.above(target.location));
    player.playAnimation("animation.player.pet");
});
