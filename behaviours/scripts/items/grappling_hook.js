import { EntityComponentTypes, GameMode, ItemLockMode, ItemStack, Player, system, TicksPerSecond, world } from "@minecraft/server";
import { add, Directions, distance, mul } from "../extensions/vectors";
import { decrementDurability, duplicateItem, findItem } from "../common";
import "../extensions/entities";

const USE_TIME = 1.0 * TicksPerSecond;
const GRAPPLE_SOUNDS = [
    "grappling_hook.retract.short",
    "grappling_hook.retract.medium",
    "grappling_hook.retract.long",
]

/** @type {import("@minecraft/server").ItemCustomComponent} */
export const grapplingHookComponent = {
    onUse: ({source: player}) => {
        player.setDynamicProperty("grapple_charge_time", system.currentTick);
        player.dimension.playSound("crossbow.loading.start", player.getHeadLocation());
    }
}

world.afterEvents.itemReleaseUse.subscribe(({itemStack: hook, source: player}) => {
    if (hook.typeId !== "tcsmp:grappling_hook") return;
    const time = player.getDynamicProperty("grapple_charge_time") ?? system.currentTick;
    if (system.currentTick - time < USE_TIME) return;

    // Replace Item
    const empty_hook = duplicateItem(hook, "tcsmp:empty_grappling_hook");
    empty_hook.lockMode = ItemLockMode.slot;
    player.inventory.container.setItem(player.selectedSlotIndex, empty_hook);

    // Instantiate Entities
    const view = player.getViewDirection(), head = player.getHeadLocation();
    const stake = player.dimension.spawnEntity("tcsmp:grappling_hook_stake", add(head, mul(view, 2)));
    const seat = player.dimension.spawnEntity("tcsmp:grappling_hook_seat", player.location);
    const seat2 = player.dimension.spawnEntity("tcsmp:grappling_hook_seat", player.location);
    
    // Setup Leash & Rider
    seat.getComponent(EntityComponentTypes.Rideable).addRider(seat2);
    seat.getComponent(EntityComponentTypes.Leashable).leashTo(stake);
    stake.setDynamicProperty("seat", seat.id);
    
    // Fire Projectile
    const projectile = stake.getComponent(EntityComponentTypes.Projectile);
    projectile.owner = player;
    projectile.shoot(mul(view, 2));
    player.dimension.playSound("crossbow.shoot", head);


    // Check Distance
    const distanceCheck = system.runInterval(() => {
        if (distance(stake.location, player.getHeadLocation()) <= 48) {
            seat.teleport(player.location);
            return;
        }
        seat.remove();
        stake.remove();

        const slot = findItem(player.inventory.container, "tcsmp:empty_grappling_hook");
        const empty_hook = player.inventory.container.getItem(slot);
        const hook = duplicateItem(empty_hook, "tcsmp:grappling_hook");
        player.inventory.container.setItem(slot, hook);
        player.dimension.playSound("leashknot.break", player.getHeadLocation());

        system.clearRun(distanceCheck);
    });
    stake.setDynamicProperty("dist_check", distanceCheck);
});

world.afterEvents.projectileHitBlock.subscribe(({projectile: stake}) => {
    if (stake.typeId !== "tcsmp:grappling_hook_stake") return;
    if (!stake?.isValid()) return;
    system.clearRun(stake.getDynamicProperty("dist_check"));

    // Setup Retracttion
    const seat = world.getEntity(stake.getDynamicProperty("seat"));
    seat.teleport(add(seat.location, mul(Directions.Up, 0.1)));
    /** @type {Player} */
    const player = stake.getComponent(EntityComponentTypes.Projectile).owner;
    const seat2 = seat.getComponent(EntityComponentTypes.Rideable).getRiders()[0];
    seat2.getComponent(EntityComponentTypes.Rideable).addRider(player);
    const head = player.getHeadLocation();
    player.dimension.playSound("leashknot.place", head);
    seat.triggerEvent("tcsmp:retract");

    const dist = distance(stake.location, head);
    player.playSound(GRAPPLE_SOUNDS[Math.floor(3 * dist / 48)]);

    // Dismount Check
    const dismountCheck = system.runInterval(() => {
        const rider_count = seat2.getComponent(EntityComponentTypes.Rideable).getRiders().length;
        if (rider_count > 0) return;
        seat2.remove();
        seat.remove();
        stake.remove();

        // Decrement Durability
        const slot = findItem(player.inventory.container, "tcsmp:empty_grappling_hook");
        const empty_hook = player.inventory.container.getItem(slot);

        const creative = player.getGameMode() === GameMode.creative;
        const duplicate = duplicateItem(empty_hook, "tcsmp:grappling_hook");
        const hook = creative ? duplicate : decrementDurability(duplicate);

        player.inventory.container.setItem(slot, hook);
        if (!hook) player.dimension.playSound("random.break", player.getHeadLocation());
        else player.dimension.playSound("leashknot.break", player.getHeadLocation());

        system.clearRun(dismountCheck);
    });
});
