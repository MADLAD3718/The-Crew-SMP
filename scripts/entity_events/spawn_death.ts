import { Entity, EntityComponentTypes, EntityDamageCause, Player, RawMessage, world } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";

const EntityAliases: Record<string, string> = {
    // Changes here must be mirrored across all ui instances
    // including chat message filters in hud_screen and chat_screen.
    // Use https://wiki.bedrock.dev/json-ui/json-ui-intro#string-formatting
    // to find the relevant byte counts for each alias.
    "tcsmp:unicorn": "§U§N§I§C§O§R§N",
    "tcsmp:cannon": "§C§A§N§N§O§N",
    "tcsmp:gerbil": "§G§E§R§B§I§L"
};

world.afterEvents.entitySpawn.subscribe(({entity}) => {
    if (EntityAliases[entity.typeId])
        entity.nameTag = EntityAliases[entity.typeId];
});

// This system fixes the issues with custom tamed entities appearing
// as "Unknown" in their death messages when unnamed. [MCPE-38136]
world.afterEvents.entityDie.subscribe(event => {
    const { deadEntity, damageSource } = event;
    if (deadEntity.nameTag != EntityAliases[deadEntity.typeId]) return;
    const tameableComponent = deadEntity.getComponent(EntityComponentTypes.Tameable);
    const tameMountComponent = deadEntity.getComponent(EntityComponentTypes.TameMount);
    const tamedToPlayer = tameableComponent?.tamedToPlayer ?? tameMountComponent?.tamedToPlayer;
    if (!tamedToPlayer) return;
    const entityKey = deadEntity.localizationKey;
    switch (damageSource.cause) {
        case EntityDamageCause.anvil:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.anvil");
            break;
        case EntityDamageCause.blockExplosion:
        case EntityDamageCause.entityExplosion:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.explosion");
            break;
        case EntityDamageCause.campfire:
        case EntityDamageCause.fire:
        case EntityDamageCause.fireTick:
        case EntityDamageCause.soulCampfire:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.inFire");
            break;
        case EntityDamageCause.contact:
            if (damageSource.damagingEntity)
                sendDeathMessage(tamedToPlayer, entityKey, "death.attack.mob", damageSource.damagingEntity);
            // The cactus death message is also sufficient for sweet berries
            else sendDeathMessage(tamedToPlayer, entityKey, "death.attack.cactus");
            break;
        case EntityDamageCause.drowning:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.drown");
            break;
        case EntityDamageCause.entityAttack:
        case EntityDamageCause.ramAttack:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.mob", damageSource.damagingEntity);
            break;
        case EntityDamageCause.fall:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.fall");
            break;
        case EntityDamageCause.fallingBlock:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.fallingBlock");
            break;
        case EntityDamageCause.fireworks:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.fireworks");
            break;
        case EntityDamageCause.flyIntoWall:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.flyIntoWall");
            break;
        case EntityDamageCause.freezing:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.freeze");
            break;
        case EntityDamageCause.lava:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.lava");
            break;
        case EntityDamageCause.lightning:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.lightningBolt");
            break;
        case EntityDamageCause.maceSmash:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.maceSmash.player", damageSource.damagingEntity);
            break;
        case EntityDamageCause.magic:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.magic");
            break;
        case EntityDamageCause.magma:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.magma");
            break;
        case EntityDamageCause.none:
        case EntityDamageCause.override:
        case EntityDamageCause.selfDestruct:
        case EntityDamageCause.temperature:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.generic");
            break;
        case EntityDamageCause.piston:
        case EntityDamageCause.suffocation:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.inWall");
            break;
        case EntityDamageCause.projectile:
            const entity = damageSource.damagingProjectile!;
            if (entity.typeId == MinecraftEntityTypes.Arrow)
                sendDeathMessage(tamedToPlayer, entityKey, "death.attack.arrow", entity.projectile!.owner);
            else if (entity.typeId == MinecraftEntityTypes.ShulkerBullet)
                sendDeathMessage(tamedToPlayer, entityKey, "death.attack.bullet", entity.projectile!.owner);
            else if (entity.typeId == MinecraftEntityTypes.ThrownTrident)
                sendDeathMessage(tamedToPlayer, entityKey, "death.attack.trident", entity.projectile!.owner);
            else sendDeathMessage(tamedToPlayer, entityKey, "death.attack.thrown", entity.projectile!.owner);
            break;
        case EntityDamageCause.sonicBoom:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.sonicBoom");
            break;
        case EntityDamageCause.stalactite:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.stalagtite");
            break;
        case EntityDamageCause.stalagmite:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.stalagmite");
            break;
        case EntityDamageCause.starve:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.starve");
            break;
        case EntityDamageCause.thorns:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.thorns", damageSource.damagingEntity);
            break;
        case EntityDamageCause.void:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.outOfWorld");
            break;
        case EntityDamageCause.wither:
            sendDeathMessage(tamedToPlayer, entityKey, "death.attack.wither");
            break;
    }
}, {entityTypes: Object.keys(EntityAliases)});

function sendDeathMessage(player: Player, entityKey: string, deathKey: string, killer?: Player | Entity): void {
    const message: RawMessage[] = [{ translate: entityKey }];
    if (killer instanceof Player)
        message.push({ translate: deathKey, with: ["", killer.name]});
    else if (killer)
        message.push(
            { translate: deathKey, with: ["", ""]},
            { translate: killer.localizationKey }
        );
    else message.push({ translate: deathKey, with: [""]});
    return player.sendMessage(message);
}
