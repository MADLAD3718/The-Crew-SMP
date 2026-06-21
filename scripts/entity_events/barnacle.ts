import BarnacleDefinition from "../../behaviours/entities/barnacle.entity.json";
import { EntityDamageCause, Player, system, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

const EATING_DAMAGE = BarnacleDefinition["minecraft:entity"].component_groups["tcsmp:eating_prey"]["minecraft:attack"].damage;

world.beforeEvents.entityHurt.subscribe(event => {
    const hurtEntity = event.hurtEntity;
    const damagingEntity = event.damageSource.damagingEntity;
    if (damagingEntity?.matches({type: "tcsmp:barnacle"})) {
        if (damagingEntity.getProperty("tcsmp:barnacle_state") == "consuming") return;
        const block_below = damagingEntity.dimension.getBlockBelow(
            damagingEntity.location, { maxDistance: 3 }
        );
        if (block_below) event.damage = EATING_DAMAGE;
    }
    else if (hurtEntity.matches({type: "tcsmp:barnacle"})) {
        if (hurtEntity.isInvunerable) return event.cancel = true;
        if (hurtEntity.getProperty("tcsmp:barnacle_state") == "dragging")
            event.damage *= 0.25;
    }
}, {allowedDamageCauses: [EntityDamageCause.entityAttack]});

world.afterEvents.entityHitEntity.subscribe(event => {
    const { damagingEntity: barnacle, hitEntity } = event;
    if (barnacle.getProperty("tcsmp:barnacle_state") == "consuming") return;
    // Prevents incorrect dragging behaviour from sea floor
    const block_below = barnacle.dimension.getBlockBelow(
        barnacle.location, { maxDistance: 3 }
    );
    if (block_below || barnacle.getDynamicProperty("draggedEntityId") != hitEntity.id)
        return barnacle.triggerEvent("tcsmp:start_consuming");

    const draggedEntity = hitEntity.entityRidingOn ?? hitEntity;
    if (draggedEntity.hasTag("tcsmp:is_being_dragged"))
        return barnacle.triggerEvent("tcsmp:start_consuming");

    if (draggedEntity instanceof Player)
        draggedEntity.onScreenDisplay.setTitle("overlay: tongue");

    draggedEntity.addTag("tcsmp:is_being_dragged");
    const interval = system.runInterval(() => {
        // Check if target is still valid (accounts for player leave)
        if (!draggedEntity.isValid || !barnacle.isValid) {
            if (draggedEntity.isValid) draggedEntity.removeTag("tcsmp:is_being_dragged");
            return system.clearRun(interval);
        }
        // Move target into position
        const head_center = Vec3.above(barnacle.location, 0.375);
        const move_target = Vec3.add(head_center, barnacle.getViewDirection());
        const to_target = Vec3.sub(move_target, draggedEntity.location);
        draggedEntity.applyImpulse(Vec3.mul(to_target, 0.125));
    });
    barnacle.setDynamicProperties({
        "dragInterval": interval,
        "draggedEntityId": draggedEntity.id
    });
}, {entityTypes: ["tcsmp:barnacle"]});

world.afterEvents.dataDrivenEntityTrigger.subscribe(({entity}) => {
    const dragInterval = entity.getDynamicProperty("dragInterval") as number | undefined;
    const draggedEntityId = entity.getDynamicProperty("draggedEntityId") as string | undefined;
    if (dragInterval) system.clearRun(dragInterval);
    if (!draggedEntityId) return;
    const draggedEntity = world.getEntity(draggedEntityId);
    draggedEntity?.removeTag("tcsmp:is_being_dragged");

    if (draggedEntity instanceof Player)
        draggedEntity.onScreenDisplay.setTitle("overlay: none");
}, {
    entityTypes: ["tcsmp:barnacle"],
    eventTypes: ["tcsmp:on_target_dragged"]
});
