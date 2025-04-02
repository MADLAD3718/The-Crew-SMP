import { EntityDamageCause, EquipmentSlot, ItemCustomComponent, MolangVariableMap, system, TicksPerSecond, Vector3, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

const DAMAGE_TIMES: Map<string, number> = new Map();
const INVUNERABILITY_DELAY = 0.5 * TicksPerSecond;

world.afterEvents.entityHurt.subscribe(event => {
    const { damage, damageSource, hurtEntity } = event;

    const { damagingEntity } = damageSource, { dimension } = hurtEntity;
    const weapon = damagingEntity?.equipment?.getEquipment(EquipmentSlot.Mainhand);
    if (weapon?.typeId != "tcsmp:lucks_bane") return;

    const toEntity = Vec3.normalize(Vec3.sub(
        hurtEntity.getHeadLocation(),
        damagingEntity?.getHeadLocation() as Vector3
    ));
    const target = Vec3.sub(hurtEntity.getHeadLocation(), toEntity);

    for (let i = 0; i < damage; i += 2) {
        system.runTimeout(() => {
            dimension.playSound("lucks_bane.big_hit", target);

            const molang = new MolangVariableMap();
            molang.setFloat("half", +(damage - i == 1));
            dimension.spawnParticle("tcsmp:lucks_bane_heart", target, molang);
        }, damageSource.cause == EntityDamageCause.entityAttack ? i : i + 2);
    }
});

const lucksBaneComponent: ItemCustomComponent = {
    onHitEntity(event) {
        const { hitEntity } = event, { dimension } = hitEntity;

        const lastHitTime = DAMAGE_TIMES.get(hitEntity.id) ?? 0;
        if (system.currentTick - lastHitTime < INVUNERABILITY_DELAY) return;

        dimension.playSound("lucks_bane.coins", Vec3.above(hitEntity.location));
        dimension.spawnParticle("tcsmp:lucks_bane_coin", Vec3.above(hitEntity.location));

        DAMAGE_TIMES.set(hitEntity.id, system.currentTick);
    }
}

export default lucksBaneComponent;
