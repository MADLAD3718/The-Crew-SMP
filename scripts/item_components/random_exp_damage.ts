import { EntityDamageCause, ItemCustomComponent, system, TicksPerSecond, world } from "@minecraft/server";
import { randomExp } from "../util";

const DAMAGE_TIMES: Map<string, number> = new Map();
const INVUNERABILITY_DELAY = 0.5 * TicksPerSecond;

const randomExpDamageComponent: ItemCustomComponent = {
    onHitEntity(event) {
        const { attackingEntity, hitEntity, itemStack } = event;
        if (!itemStack) return;

        const lastHitTime = DAMAGE_TIMES.get(hitEntity.id) ?? 0;
        if (system.currentTick - lastHitTime < INVUNERABILITY_DELAY) return;

        const mean = parseFloat(itemStack.getTagProperty("mean_damage") as string);
        const damage = Math.floor(randomExp(1 / mean));

        hitEntity.applyDamage(damage, {
            cause: EntityDamageCause.magic,
            damagingEntity: attackingEntity,
        });

        DAMAGE_TIMES.set(hitEntity.id, system.currentTick);
    }
}

export default randomExpDamageComponent;
