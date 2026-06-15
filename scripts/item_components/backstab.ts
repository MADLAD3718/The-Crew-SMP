import { EntityDamageCause, EquipmentSlot, ItemCustomComponent, system, TicksPerSecond, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

const BackstabTimes: Record<string, number> = {};
const BACKSTAB_DELAY = 1.5 * TicksPerSecond;

const ENTITY_ANGLE = Math.PI / 3;
const COS_ENTITY = Math.cos(ENTITY_ANGLE);

const LOOK_ANGLE = 3 * Math.PI / 5;
const COS_LOOK = Math.cos(LOOK_ANGLE);

type BackstabParameters = {
    extra_damage: number
}

world.beforeEvents.entityHurt.subscribe(event => {
    const { damageSource, hurtEntity } = event, { damagingEntity } = damageSource;
    const item = damagingEntity!.equipment?.getEquipment(EquipmentSlot.Mainhand);
    const component = item?.getComponent("tcsmp:backstab");
    
    const lastBackstabbedTick = BackstabTimes[hurtEntity.id] ?? 0;
    if (!component || system.currentTick - lastBackstabbedTick < BACKSTAB_DELAY) return;
    else BackstabTimes[hurtEntity.id] = system.currentTick;

    const params = component.customComponentParameters.params as BackstabParameters;
    const { dimension } = hurtEntity;

    const view = damagingEntity!.getViewDirection();
    const head = damagingEntity!.getHeadLocation();
    const targetView = hurtEntity.getViewDirection();
    const targetHead = hurtEntity.getHeadLocation();

    const toEntity = Vec3.normalize(Vec3.sub(targetHead, head));
    if (Vec3.dot(toEntity, view) < COS_ENTITY) return;

    if (Vec3.dot(targetView, view) < COS_LOOK) return;

    event.damage += params.extra_damage;
    system.run(() => {
        dimension.playSound("knife.backstab", hurtEntity.location);
        dimension.spawnParticle("tcsmp:backstab", Vec3.sub(targetHead, toEntity));
    });
}, {allowedDamageCauses: [EntityDamageCause.entityAttack]});

const backstabComponent: ItemCustomComponent = {};

export default backstabComponent;
