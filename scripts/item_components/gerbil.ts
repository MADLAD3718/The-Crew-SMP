import { Vec3 } from "@madlad3718/mcveclib";
import { EntityComponentTypes, EquipmentSlot, ItemCustomComponent, ItemStack, Player, system, TicksPerSecond, world } from "@minecraft/server";
import { randomRange } from "../util";

const PICKUP_DELAY = 0.25 * TicksPerSecond;
const PickupTimes: Record<string, number> = {};

world.afterEvents.playerInteractWithEntity.subscribe(event => {
    const { player, target, itemStack } = event;
    if (!target.isValid || !player.isValid) return;
    if (!target.matches({ type: "tcsmp:gerbil" })) return;
    if (target.getComponent(EntityComponentTypes.IsBaby)) return;
    if (itemStack) return;

    const tameable = target.getComponent(EntityComponentTypes.Tameable);
    if (tameable?.tamedToPlayerId != player.id) return;

    const item = new ItemStack("tcsmp:gerbil");
    if (target.nameTag != "§G§E§R§B§I§L")
        item.nameTag = target.nameTag;

    target.remove();
    player.equipment.getEquipmentSlot(EquipmentSlot.Mainhand).setItem(item);

    const head = player.getHeadLocation();
    player.dimension.playSound("random.pop", head, {
        pitch: randomRange(0.6, 2.2), volume: 0.25
    });

    PickupTimes[player.id] = system.currentTick;
});

const gerbilComponent: ItemCustomComponent = {
    onUseOn(event) {
        const { source, itemStack, faceLocation, block, blockFace } = event;
        if (!(source instanceof Player)) return;

        const lastPickedUpTime = PickupTimes[source.id] ?? 0;
        if (system.currentTick - lastPickedUpTime < PICKUP_DELAY) return;

        const offset = Vec3.saturate(Vec3.fromDirection(blockFace));
        const target = Vec3.add(block, faceLocation, offset);
        const gerbil = source.dimension.spawnEntity("tcsmp:gerbil", target);

        gerbil.nameTag = itemStack.nameTag ?? "§G§E§R§B§I§L";
        gerbil.triggerEvent("tcsmp:grow_up");

        const tameable = gerbil.getComponent(EntityComponentTypes.Tameable);
        tameable!.tame(source);

        const head = source.getHeadLocation();
        gerbil.lookAt(head);

        source.equipment.getEquipmentSlot(EquipmentSlot.Mainhand).setItem();

        source.dimension.playSound("random.pop", head, {
            pitch: randomRange(0.55, 0.75), volume: 0.3
        });
    }
}

export default gerbilComponent;
