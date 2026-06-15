import { EntityDamageCause, EquipmentSlot, ItemCustomComponent, world } from "@minecraft/server";
import { randomExp, roundTo } from "../util";

type RandomExpDamageParameters = {
    mean_damage: number;
}

world.beforeEvents.entityHurt.subscribe(event => {
    const { damageSource } = event, damagingEntity = damageSource.damagingEntity!;
    const damagingItem = damagingEntity.equipment?.getEquipment(EquipmentSlot.Mainhand);
    const component = damagingItem?.getComponent("tcsmp:random_exp_damage");
    if (!component) return;

    const params = component.customComponentParameters.params as RandomExpDamageParameters;
    let damage = event.damage + roundTo(randomExp(params.mean_damage), 1);

    event.damage = damage;
}, { allowedDamageCauses: [EntityDamageCause.entityAttack] });

const randomExpDamageComponent: ItemCustomComponent = {};

export default randomExpDamageComponent;
