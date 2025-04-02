import { BlockRaycastHit, EntityComponentTypes, EquipmentSlot, ItemCustomComponent, ItemStack, Player, system, TicksPerSecond, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";

const PICKUP_TIMES: Map<string, number> = new Map();
const PICKUP_DELAY = 0.25 * TicksPerSecond;

world.afterEvents.playerInteractWithEntity.subscribe(event => {
    const { player, target, itemStack } = event;
    if (!target.matches({type: "tcsmp:gerbil"})) return;
    if (!player.isSneaking) return;

    if (!itemStack) {
        if (!target.nameTag) return;

        const tameable = target.getComponent(EntityComponentTypes.Tameable);
        if (tameable?.isTamed && tameable.tamedToPlayerId != player.id) return;
    
        const item = new ItemStack("tcsmp:gerbil");
        item.nameTag = target.nameTag;
        
        target.remove();
        player.equipment.getEquipmentSlot(EquipmentSlot.Mainhand).setItem(item);
    
        const head = player.getHeadLocation();
        player.dimension.playSound("random.pop", head);
        player.dimension.playSound("mob.gerbil.chirp", head);
    
        PICKUP_TIMES.set(player.id, system.currentTick);
    }
    else if (itemStack.typeId == MinecraftItemTypes.NameTag) {
        if (target.nameTag) return;

        const tameable = target.getComponent(EntityComponentTypes.Tameable);
        if (!tameable?.isTamed) tameable?.tame(player);
    }
});

const gerbilComponent: ItemCustomComponent = {
    onUseOn(event) {
        const { source, itemStack } = event;
        if (!(source instanceof Player && source.isSneaking)) return;

        const lastPickedUpTime = PICKUP_TIMES.get(source.id) ?? 0;
        if (system.currentTick - lastPickedUpTime < PICKUP_DELAY) return;

        const raycast = source.getBlockFromViewDirection() as BlockRaycastHit;
        const target = Vec3.add(raycast.block, raycast.faceLocation);

        const gerbil = source.dimension.spawnEntity("tcsmp:gerbil", target);
        if (itemStack.nameTag) gerbil.nameTag = itemStack.nameTag;

        const tameable = gerbil.getComponent(EntityComponentTypes.Tameable);
        tameable?.tame(source);
        
        source.equipment.getEquipmentSlot(EquipmentSlot.Mainhand).setItem();
    }
}

export default gerbilComponent;
