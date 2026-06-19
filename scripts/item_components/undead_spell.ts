import { EntityComponentTypes, ItemCustomComponent, MolangVariableMap, TicksPerSecond, world } from "@minecraft/server";
import { MinecraftDimensionTypes, MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { FactionColour, FactionRegistry } from "../systems/factions";
import { randBoundedDisk, randomRange } from "../util";
import { Vec2, Vec3 } from "@madlad3718/mcveclib";

const ENTITY_COUNT = 12;
const SKELETON_CHANCE = 5 / 12;

const ValidDimensionIds: Set<string> = new Set([
    MinecraftDimensionTypes.Overworld,
    MinecraftDimensionTypes.Nether
]);

world.beforeEvents.itemUse.subscribe(event => {
    const { source, itemStack } = event, { dimension } = source;
    if (!itemStack.getComponent("tcsmp:undead_spell")?.isValid) return;

    event.cancel = !ValidDimensionIds.has(dimension.id);
});

world.afterEvents.dataDrivenEntityTrigger.subscribe(({ entity }) => {
    const { location, dimension } = entity;
    const molang = new MolangVariableMap();
    molang.setVector3("aabb", entity.getAABB().extent);
    dimension.spawnParticle("tcsmp:faded_death_explosion", location, molang);
    entity.remove();
}, {
    eventTypes: ["tcsmp:instant_despawn"],
    entityTypes: [
        "tcsmp:faded_skeleton",
        "tcsmp:faded_zombie"
    ]
});

const undeadSpellComponent: ItemCustomComponent = {
    onUse({ source }) {
        const { dimension, location } = source;
        const faction = FactionRegistry.getFaction(source);
        const colourIndex = faction ? Object.values(FactionColour).indexOf(faction.colour) + 1 : 0;
        source.addEffect(MinecraftEffectTypes.Darkness, TicksPerSecond * 3.5, {showParticles: false});

        for (let i = 0; i < ENTITY_COUNT; ++i) {
            const sample = Vec2.toVectorXZ(randBoundedDisk(4, 8));
            const target = Vec3.add(location, Vec3.fromVectorXZ(sample));
            const block = dimension.getTopmostBlock(target, location.y + 4);
            if (!block) continue;

            const spawn_location = Vec3.above(block.bottomCenter());
            const entityId = Math.random() <= SKELETON_CHANCE ? "tcsmp:faded_skeleton" : "tcsmp:faded_zombie";
            const entity = dimension.spawnEntity(entityId, spawn_location);
            entity.getComponent(EntityComponentTypes.Tameable)!.tame(source);
            entity.setProperty("tcsmp:faction_variant", colourIndex);

            const sound = entityId == "tcsmp:faded_zombie" ? "mob.faded_zombie.say" : "mob.faded_skeleton.say";
            dimension.playSound(sound, entity.location, {pitch: randomRange(0.8, 1.2)});
        }
    }
};

export default undeadSpellComponent;
