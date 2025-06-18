import { EntityDamageCause, ItemCustomComponent, system, TicksPerSecond } from "@minecraft/server";
import { randomExp } from "../util";

const DAMAGE_TIMES: Map<string, number> = new Map();
const INVUNERABILITY_DELAY = 0.5 * TicksPerSecond;

type RandomExpDamageParameters = {
    mean_damage: number;
}

const randomExpDamageComponent: ItemCustomComponent = {
    onHitEntity(event, parameters) {
        const { attackingEntity, hitEntity, itemStack } = event;
        if (!itemStack) return;

        const { params } = parameters as { params: RandomExpDamageParameters };

        const lastHitTime = DAMAGE_TIMES.get(hitEntity.id) ?? 0;
        if (system.currentTick - lastHitTime < INVUNERABILITY_DELAY) return;

        const damage = Math.floor(randomExp(1 / params.mean_damage));

        hitEntity.applyDamage(damage, {
            cause: EntityDamageCause.magic,
            damagingEntity: attackingEntity,
        });

        DAMAGE_TIMES.set(hitEntity.id, system.currentTick);
    }
}

export default randomExpDamageComponent;
