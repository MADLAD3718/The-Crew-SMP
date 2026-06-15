import { Dimension, Entity, ListBlockVolume, MolangVariableMap, Player, Vector3, world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { Vec3 } from "@madlad3718/mcveclib";
import { randomRange } from "../util";

const conversionFactor: Vector3 = {x: 8, y: 3, z: 8};

function locationOverworldToNether(location: Vector3): Vector3 {
    return Vec3.div(Vec3.above(location, 64), conversionFactor);
}

function locationNetherToOverworld(location: Vector3): Vector3 {
    return Vec3.below(Vec3.mul(location, conversionFactor), 64);
}

world.afterEvents.projectileHitBlock.subscribe(event => {
    warpCrystalHit(event.dimension, event.location, event.projectile);
});

world.afterEvents.projectileHitEntity.subscribe(event => {
    const entityHit = event.getEntityHit();
    const location = entityHit.entity?.location ?? event.location;
    warpCrystalHit(event.dimension, location, event.projectile);
});

function warpCrystalHit(dimension: Dimension, location: Vector3, projectile: Entity): void {
    if (!projectile.isValid || !projectile.matches({type: "tcsmp:tempered_warp_crystal"})) return;
    projectile.remove();

    dimension.playSound("tempered_warp_crystal.whoosh", location, {
        pitch: randomRange(0.8, 1.2), volume: 0.5
    });

    const breaking_molang = new MolangVariableMap;
    breaking_molang.setFloat("num_particles", 30);
    breaking_molang.setFloat("emitter_radius", 0.0);
    breaking_molang.setFloat("speed_modifier", 1.0);
    breaking_molang.setFloat("size_modifier", 1.0);
    dimension.spawnParticle("tcsmp:tempered_warp_crystal_shards", location, breaking_molang);

    const splash_molang = new MolangVariableMap;
    splash_molang.setFloat("splash_range", 1.0);
    splash_molang.setFloat("splash_power", 1.0);
    dimension.spawnParticle("tcsmp:portal_splash", location, splash_molang);
    
    if (dimension.id != MinecraftDimensionTypes.Overworld &&
        dimension.id != MinecraftDimensionTypes.Nether) return;

    const target_is_nether = dimension.id == MinecraftDimensionTypes.Overworld;
    const convertLocation = target_is_nether ?
        locationOverworldToNether : locationNetherToOverworld;
    const target_dimension_id = target_is_nether ?
        MinecraftDimensionTypes.Nether : MinecraftDimensionTypes.Overworld;
    const target_dimension = world.getDimension(target_dimension_id);
    
    const entities = dimension.getEntities({location, maxDistance: 2.0});
    for (const entity of entities) if (entity instanceof Player) entity.playSound("portal.trigger");
    const loadVolume = new ListBlockVolume(entities.map(entity => entity.location));
    if (entities.length > 0)
        world.tickingAreaManager.createTickingArea(
            "tcsmp:tempered_warp_crystal", {
                dimension: target_dimension,
                from: convertLocation(loadVolume.getMin()),
                to: convertLocation(loadVolume.getMax())
            }
        ).then(() => {
            for (const entity of entities) {
                const new_location = convertLocation(entity.location);
                const minHeight = target_dimension.heightRange.max - 1;
                const safe_block = target_dimension.getTopmostBlock(new_location, minHeight);
                if (safe_block) entity.teleport(
                    Vec3.above(safe_block.bottomCenter()),
                    {dimension: target_dimension}
                );
            }
        }).finally(() => {
            world.tickingAreaManager.removeTickingArea("tcsmp:tempered_warp_crystal");
        });
}
