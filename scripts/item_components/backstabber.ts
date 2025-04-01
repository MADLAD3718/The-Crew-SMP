import { EntityDamageCause, ItemCustomComponent, system, TicksPerSecond } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

const DAMAGE_TIMES: Map<string, number> = new Map();
const INVUNERABILITY_DELAY = 1.5 * TicksPerSecond;

const ENTITY_ANGLE = Math.PI / 3;
const COSE = Math.cos(ENTITY_ANGLE);

const LOOK_ANGLE = 3 * Math.PI / 5;
const COSL = Math.cos(LOOK_ANGLE);

const backstabberComponent: ItemCustomComponent = {
    onHitEntity(event) {
        const { attackingEntity, hitEntity, itemStack } = event, { dimension } = hitEntity;
        
        const lastHitTime = DAMAGE_TIMES.get(hitEntity.id) ?? 0;
        if (system.currentTick - lastHitTime < INVUNERABILITY_DELAY) return;

        const view = attackingEntity.getViewDirection();
        const head = attackingEntity.getHeadLocation();
        const targetView = hitEntity.getViewDirection();
        const targetHead = hitEntity.getHeadLocation();

        const toEntity = Vec3.normalize(Vec3.sub(targetHead, head));
        if (Vec3.dot(toEntity, view) < COSE) return;

        if (Vec3.dot(targetView, view) < COSL) return;

        const backstabDamage = parseInt(itemStack?.getTagProperty("backstab_damage") as string);
        hitEntity.applyDamage(backstabDamage, {
            cause: EntityDamageCause.entityAttack,
            damagingEntity: attackingEntity
        });
        dimension.playSound("knife.backstab", hitEntity.location);

        dimension.spawnParticle("tcsmp:backstab", Vec3.sub(targetHead, toEntity));

        DAMAGE_TIMES.set(hitEntity.id, system.currentTick);
    }
}

export default backstabberComponent;
