import { EntityComponentTypes, EquipmentSlot, system, TicksPerSecond, world } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { Vec3 } from "@madlad3718/mcveclib";

const PET_DELAY = 0.5 * TicksPerSecond;
const PetTimes: Record<string, number> = {};

world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    const { player, target } = event;

    if (!target.isValid ||
        !target.matches({type: MinecraftEntityTypes.Wolf}) ||
        !target.hasComponent(EntityComponentTypes.IsTamed) ||
        player.equipment.getEquipment(EquipmentSlot.Mainhand) ||
        Vec3.distance(player.location, target.location) > 1.5 ||
        !player.isSneaking
    ) return;
    event.cancel = true;

    if (system.currentTick - (PetTimes[target.id] ?? 0) < PET_DELAY) return;
    PetTimes[target.id] = system.currentTick;

    const { dimension } = player;

    system.run(() => {
        dimension.playSound("wolf.pet", target.location);
        const variant = target.getProperty("minecraft:sound_variant");
        const sound = variant == "default" ? "mob.wolf.bark" : `mob.wolf.${variant}.bark`;
        dimension.playSound(sound, target.location);
    
        dimension.spawnParticle("minecraft:heart_particle", Vec3.above(target.location));
        player.playAnimation("animation.player.pet");
    });
});
