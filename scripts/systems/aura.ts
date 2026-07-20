import { Entity, EntityComponentTypes, EntityDamageCause, Player, world } from "@minecraft/server";
import { MinecraftBlockTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { clamp } from "../util";

export namespace AuraTracking {
    export function initialize(): void {
        world.afterEvents.entityHurt.subscribe(event => {
            switch (event.damageSource.cause) {
                case EntityDamageCause.fall:
                    const health = event.hurtEntity.getComponent(EntityComponentTypes.Health)!;
                    if (health.currentValue <= health.effectiveMin) break;

                    updateAura(event.hurtEntity, -Math.ceil(event.damage));
                    break;
                case EntityDamageCause.entityAttack:
                    if (event.damageSource.damagingEntity instanceof Player) {
                        updateAura(event.damageSource.damagingEntity, 1);
                        updateAura(event.hurtEntity, -1);
                    }
                    break;
                case EntityDamageCause.projectile:
                    const entity = event.damageSource.damagingProjectile;
                    const owner = entity?.projectile?.owner;
                    if (owner instanceof Player) {
                        updateAura(owner, 2);
                        updateAura(event.hurtEntity, -2);
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
            if (event.deadEntity instanceof Player) updateAura(event.deadEntity, -20);
            else if (event.damageSource.damagingEntity instanceof Player) {
                const player = event.damageSource.damagingEntity;
                const killedHealth = event.deadEntity.getComponent(EntityComponentTypes.Health)!;

                updateAura(player, Math.ceil(killedHealth.effectiveMax / 10));
            }
        });

        world.afterEvents.playerBreakBlock.subscribe(event => {
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
