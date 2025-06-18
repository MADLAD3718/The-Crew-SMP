import { EquipmentSlot, GameMode, Player, Vector3, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

world.afterEvents.projectileHitEntity.subscribe(event => {
    const hitEntity = event.getEntityHit().entity;
    if (!(hitEntity instanceof Player)) return;
    if (!isUsingTNTShield(hitEntity)) return;

    hitTNTShield(hitEntity, event.hitVector);
});

world.afterEvents.entityHitEntity.subscribe(event => {
    const { hitEntity, damagingEntity } = event;
    if (!(hitEntity instanceof Player)) return;
    if (!isUsingTNTShield(hitEntity)) return;

    const toHolder = Vec3.normalize(Vec3.sub(hitEntity.location, damagingEntity.location));
    hitTNTShield(hitEntity, toHolder);
});

function isUsingTNTShield(holder: Player): boolean {
    if (!holder.isSneaking) return false;

    const mainhand = holder.equipment.getEquipment(EquipmentSlot.Mainhand);
    const offhand = holder.equipment.getEquipment(EquipmentSlot.Offhand);
    if (offhand?.typeId == "minecraft:shield") return false;

    return offhand?.typeId == "tcsmp:tnt_shield" || mainhand?.typeId == "tcsmp:tnt_shield";
}

function hitTNTShield(holder: Player, direction: Vector3) {
    const { dimension } = holder, view = holder.getViewDirection();
    if (Vec3.dot(direction, view) > -0.5 || !holder.isSneaking) return;

    dimension.createExplosion(holder.location, 8, {
        breaksBlocks: false, source: holder
    });
    if (holder.getGameMode() == GameMode.Creative) return;

    const mainhand = holder.equipment.getEquipmentSlot(EquipmentSlot.Mainhand);
    const offhand = holder.equipment.getEquipmentSlot(EquipmentSlot.Offhand);
    const usingOffhand = offhand.hasItem() && offhand.typeId == "tcsmp:tnt_shield";

    const slot = usingOffhand ? offhand : mainhand;
    const item = slot?.getItem()?.damage();
    slot?.setItem(item);
}
