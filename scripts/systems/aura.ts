import { Entity, EntityComponentTypes, EntityDamageCause, Player, world } from "@minecraft/server";
import { MinecraftBlockTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { clamp } from "../util";

export namespace AuraTracking {
    export function initialize(): void {
        world.afterEvents.entityHurt.subscribe(event => {
            const { damage, damageSource, hurtEntity } = event;
            if (!hurtEntity.isValid) return;

            switch (damageSource.cause) {
                case EntityDamageCause.fall:
                    const health = hurtEntity.getComponent(EntityComponentTypes.Health)!;
                    if (health.currentValue <= health.effectiveMin) break;

                    updateAura(hurtEntity, -Math.ceil(damage / 2));
                    break;
                case EntityDamageCause.entityAttack:
                    if (damageSource.damagingEntity?.isValid &&
                        damageSource.damagingEntity instanceof Player) {
                        updateAura(damageSource.damagingEntity, 1);
                        updateAura(hurtEntity, -1);
                    }
                    break;
                case EntityDamageCause.projectile:
                    const entity = damageSource.damagingProjectile;
                    if (!entity?.isValid) break;

                    const owner = entity.projectile?.owner;
                    if (owner instanceof Player) {
                        updateAura(owner, 2);
                        updateAura(hurtEntity, -2);
                    }
                    break;
            }
        }, {
            entityTypes: [MinecraftEntityTypes.Player],
            allowedDamageCauses: [
                EntityDamageCause.fall,
                EntityDamageCause.entityAttack,
                EntityDamageCause.projectile
            ]
        });

        world.afterEvents.entityDie.subscribe(event => {
            const { deadEntity, damageSource } = event;
            if (!deadEntity.isValid) return;

            if (deadEntity instanceof Player) updateAura(deadEntity, -20);
            else if (damageSource.damagingEntity?.isValid &&
                damageSource.damagingEntity instanceof Player) {
                const player = damageSource.damagingEntity;
                const killedHealth = deadEntity.getComponent(EntityComponentTypes.Health)!;

                updateAura(player, Math.ceil(killedHealth.effectiveMax / 10));
            }
        });

        world.afterEvents.playerBreakBlock.subscribe(event => {
            const { player } = event;
            if (!player.isValid) return;

            updateAura(event.player, 5);
        }, {
            blockTypes: [
                MinecraftBlockTypes.DiamondOre,
                MinecraftBlockTypes.DeepslateDiamondOre,
                MinecraftBlockTypes.AncientDebris
            ]
        });
    }

    export function updateAura(entity: Entity, addition: number): void {
        const auraScore = entity.getDynamicProperty("aura") as number;
        const newScore = clamp(auraScore + addition, -100, 100);
        entity.setDynamicProperty("aura", newScore);

        const aura = world.scoreboard.getObjective("aura")!;
        if (aura.hasParticipant(entity))
            aura.setScore(entity, newScore);
    }
};
