import { MolangVariableMap, ProjectileHitBlockAfterEvent, ProjectileHitEntityAfterEvent, world } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";

world.afterEvents.projectileHitBlock.subscribe(lightningBottleHit);
world.afterEvents.projectileHitEntity.subscribe(lightningBottleHit);

function lightningBottleHit(
    {dimension, location, projectile}: ProjectileHitBlockAfterEvent | ProjectileHitEntityAfterEvent
): void {
    if (!projectile.isValid || !projectile.matches({type: "tcsmp:lightning_bottle"})) return;
    projectile.remove();
    
    dimension.spawnEntity(MinecraftEntityTypes.LightningBolt, location);

    const breaking_molang = new MolangVariableMap;
    breaking_molang.setFloat("num_particles", 10);
    breaking_molang.setFloat("emitter_radius", 0.0);
    breaking_molang.setFloat("speed_modifier", 1.0);
    breaking_molang.setFloat("size_modifier", 1.25);
    dimension.spawnParticle("tcsmp:bottle_shards", location, breaking_molang);

    const splash_molang = new MolangVariableMap;
    splash_molang.setFloat("splash_range", 1.0);
    splash_molang.setFloat("splash_power", 1.0);
    splash_molang.setColorRGBA("color", {red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0});
    dimension.spawnParticle("minecraft:splash_spell_emitter", location, splash_molang);
}
