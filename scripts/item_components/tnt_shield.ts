import { Entity, EntityDamageCause, EquipmentSlot, GameMode, Player, Vector3, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

world.beforeEvents.entityHurt.subscribe(event => {
    const { damageSource, hurtEntity } = event;

    const view = hurtEntity.getViewDirection();
    const hview = Vec3.normalize(Vec3.from(view.x, 0, view.z));
    const direction = damageSource.cause == EntityDamageCause.entityAttack ?
        Vec3.normalize(Vec3.sub(hurtEntity.location, damageSource.damagingEntity!.location)) :
        Vec3.normalize(damageSource.damagingProjectile!.getVelocity());

    const hdirection = Vec3.normalize(Vec3.from(direction.x, 0, direction.z));
    if (Vec3.dot(hdirection, hview) > -0.5 || !hurtEntity.isSneaking) return;

    event.cancel = isUsingTNTShield(event.hurtEntity);
}, {allowedDamageCauses: [
    EntityDamageCause.entityAttack,
    EntityDamageCause.projectile
]});

world.afterEvents.projectileHitEntity.subscribe(event => {
    const hitEntity = event.getEntityHit().entity!;
    if (!hitEntity.isValid || !isUsingTNTShield(hitEntity)) return;

    hitTNTShield(hitEntity, event.hitVector);
});

world.afterEvents.entityHitEntity.subscribe(event => {
    const { hitEntity, damagingEntity } = event;
    if (!hitEntity.isValid || !isUsingTNTShield(hitEntity)) return;

    const toHolder = Vec3.normalize(Vec3.sub(hitEntity.location, damagingEntity.location));
    hitTNTShield(hitEntity, toHolder);
});

function isUsingTNTShield(holder: Entity): boolean {
    if (!holder.isSneaking) return false;

    const mainhand = holder.equipment?.getEquipment(EquipmentSlot.Mainhand);
    const offhand = holder.equipment?.getEquipment(EquipmentSlot.Offhand);
    if (offhand?.typeId == "minecraft:shield") return false;

    return offhand?.typeId == "tcsmp:tnt_shield" || mainhand?.typeId == "tcsmp:tnt_shield";
}

function hitTNTShield(holder: Entity, direction: Vector3) {
    const { dimension } = holder, view = holder.getViewDirection();
    const hview = Vec3.normalize(Vec3.from(view.x, 0, view.z));
    const hdirection = Vec3.normalize(Vec3.from(direction.x, 0, direction.z));
    if (Vec3.dot(hdirection, hview) > -0.5 || !holder.isSneaking) return;

    dimension.createExplosion(holder.location, 4, {
        breaksBlocks: false, source: holder
    });
    holder.applyKnockback(Vec3.mul(hdirection, 1.25), 0.33);
    if (holder instanceof Player && holder.getGameMode() == GameMode.Creative) return;

    const mainhand = holder.equipment?.getEquipmentSlot(EquipmentSlot.Mainhand);
    const offhand = holder.equipment?.getEquipmentSlot(EquipmentSlot.Offhand);
    const usingOffhand = offhand?.hasItem() && offhand.typeId == "tcsmp:tnt_shield";

    const slot = usingOffhand ? offhand : mainhand;
    const item = slot?.getItem()?.damage();
    slot?.setItem(item);
    if (!item) dimension.playSound(
        "random.break",
        holder.getHeadLocation(),
        { pitch: 0.9 }
    );
}
