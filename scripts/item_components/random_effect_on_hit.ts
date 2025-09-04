import { EffectTypes, EquipmentSlot, ItemCustomComponent, TicksPerSecond, world } from "@minecraft/server";
import { randomElement } from "../util";

const randomEffectOnHitComponent: ItemCustomComponent = {}

world.afterEvents.entityHitEntity.subscribe(event => {
    const { damagingEntity, hitEntity } = event;
    if (!hitEntity.equipment) return;
    
    const armour = [
        hitEntity.equipment.getEquipment(EquipmentSlot.Head),
        hitEntity.equipment.getEquipment(EquipmentSlot.Chest),
        hitEntity.equipment.getEquipment(EquipmentSlot.Legs),
        hitEntity.equipment.getEquipment(EquipmentSlot.Feet)
    ];

    for (const item of armour) {
        if (item?.hasComponent("tcsmp:random_effect_on_hit")) {
            const effect = randomElement(EffectTypes.getAll());
            console.warn(`There was an interaction! Applying effect ${effect.getName()}!`);
            return damagingEntity.addEffect(effect, TicksPerSecond * 3);
        }
    }
});

world.afterEvents.projectileHitEntity.subscribe(event => {
    const hitEntity = event.getEntityHit().entity;
    if (!hitEntity?.isValid || !event.source?.isValid) return;

    if (!hitEntity.equipment) return;
    const armour = [
        hitEntity.equipment.getEquipment(EquipmentSlot.Head),
        hitEntity.equipment.getEquipment(EquipmentSlot.Chest),
        hitEntity.equipment.getEquipment(EquipmentSlot.Legs),
        hitEntity.equipment.getEquipment(EquipmentSlot.Feet)
    ];

    for (const item of armour) {
        if (item?.hasComponent("tcsmp:random_effect_on_hit")) {
            const effect = randomElement(EffectTypes.getAll());
            console.warn(`There was an interaction! Applying effect ${effect.getName()}!`);
            return event.source.addEffect(effect, TicksPerSecond * 3);
        }
    }
});

export default randomEffectOnHitComponent;
