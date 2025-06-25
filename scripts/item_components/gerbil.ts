import { EntityComponentTypes, EquipmentSlot, ItemCustomComponent, ItemStack, Player, system, TicksPerSecond, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

const PICKUP_TIMES: Map<string, number> = new Map();
const PICKUP_DELAY = 0.25 * TicksPerSecond;

world.afterEvents.playerInteractWithEntity.subscribe(event => {
    const { player, target, itemStack } = event;
    if (!target.matches({type: "tcsmp:gerbil"})) return;
    if (target.getComponent(EntityComponentTypes.IsBaby)) return;
    if (itemStack) return;
    
    const tameable = target.getComponent(EntityComponentTypes.Tameable);
    if (tameable?.tamedToPlayerId != player.id) return;

    const item = new ItemStack("tcsmp:gerbil");
    item.nameTag = target.nameTag;
    
    target.remove();
    player.equipment.getEquipmentSlot(EquipmentSlot.Mainhand).setItem(item);

    const head = player.getHeadLocation();
    player.dimension.playSound("random.pop", head);
    player.dimension.playSound("mob.gerbil.chirp", head);

    PICKUP_TIMES.set(player.id, system.currentTick);
});

const gerbilComponent: ItemCustomComponent = {
    onUseOn(event) {
        const { source, itemStack, faceLocation, block } = event;
        if (!(source instanceof Player)) return;

        const lastPickedUpTime = PICKUP_TIMES.get(source.id) ?? 0;
        if (system.currentTick - lastPickedUpTime < PICKUP_DELAY) return;

        const target = Vec3.add(block, faceLocation, Vec3.Up);
        const gerbil = source.dimension.spawnEntity("tcsmp:gerbil", target);
        
        if (itemStack.nameTag) gerbil.nameTag = itemStack.nameTag;
        gerbil.triggerEvent("tcsmp:grow_up");

        const tameable = gerbil.getComponent(EntityComponentTypes.Tameable);
        tameable?.tame(source);
        
        source.equipment.getEquipmentSlot(EquipmentSlot.Mainhand).setItem();
    }
}

export default gerbilComponent;
