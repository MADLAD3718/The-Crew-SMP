import { MolangVariableMap, world } from "@minecraft/server";
import { randomRange } from "../util";

world.afterEvents.dataDrivenEntityTrigger.subscribe(({ entity, eventId }) => {
    const { location, dimension } = entity;

    if (eventId == "tcsmp:about_to_despawn") {
        const molang = new MolangVariableMap();
        molang.setVector3("aabb", entity.getAABB().extent);
        dimension.spawnParticle("tcsmp:faded_wilter", location, molang);

        const sound = entity.typeId == "tcsmp:faded_zombie" ?
            "mob.faded_zombie.wilter" : "mob.faded_skeleton.wilter"
        dimension.playSound(sound, location, {
            pitch: randomRange(1.2, 1.4)
        });
    }

    else {
        const molang = new MolangVariableMap();
        molang.setVector3("aabb", entity.getAABB().extent);
        dimension.spawnParticle("tcsmp:faded_death_explosion", location, molang);
    
        const sound = entity.typeId == "tcsmp:faded_zombie" ?
            "mob.faded_zombie.death" : "mob.faded_skeleton.death"
        dimension.playSound(sound, location, {
            pitch: randomRange(0.8, 1.2)
        });
    
        entity.remove();
    }
}, {
    eventTypes: [
        "tcsmp:about_to_despawn",
        "tcsmp:instant_despawn"
    ],
    entityTypes: [
        "tcsmp:faded_skeleton",
        "tcsmp:faded_zombie"
    ]
});
