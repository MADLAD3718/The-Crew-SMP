import { Entity, EntityComponentTypes, EntityDamageCause, Player, world } from "@minecraft/server";
import { MinecraftBlockTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { clamp } from "../util";

export namespace AuraTracking {
    export function initialize(): void {
        world.afterEvents.entityHurt.subscribe(event => {
            updateAura(event.hurtEntity, -Math.ceil(event.damage));
        }, {
            entityTypes: [MinecraftEntityTypes.Player],
            allowedDamageCauses: [EntityDamageCause.fall]
        });

        world.afterEvents.entityDie.subscribe(event => {
            if (event.deadEntity instanceof Player) {
                if (event.damageSource.cause === EntityDamageCause.fall) return;

                updateAura(event.deadEntity, -20);
            }
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
                MinecraftBlockTypes.DeepslateDiamondOre
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
