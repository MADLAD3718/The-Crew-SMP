import { GameMode, ItemLockMode, ItemStack, system, TicksPerSecond, world } from "@minecraft/server";
import { add, Directions, distance, mul } from "../extensions/vectors";
import { decrementDurability, duplicateItem } from "../common";
import "../extensions/entities";

const USE_TIME = 1.0 * TicksPerSecond;
const GRAPPLE_SOUNDS = [
    "grappling_hook.retract.short",
    "grappling_hook.retract.medium",
    "grappling_hook.retract.long",
]
const PLAYER_GRAPPLE_TIMES = new Map();

/** @type {import("@minecraft/server").ItemCustomComponent} */
export const grapplingHookComponent = {
    onUse: ({source: player}) => {
        PLAYER_GRAPPLE_TIMES.set(player.id, system.currentTick);
        player.dimension.playSound("crossbow.loading.start", player.getHeadLocation());
    }
}

world.afterEvents.itemReleaseUse.subscribe(({itemStack: hook, source: player}) => {
    if (hook.typeId !== "tcsmp:grappling_hook") return;
    const time = PLAYER_GRAPPLE_TIMES.get(player.id) ?? system.currentTick;
    if (system.currentTick - time < USE_TIME) return;

    // Kick Off Current Ride
    player.entityRidingOn?.ejectRider(player);

    // Replace Item
    system.runTimeout(() => {
        const empty_hook = duplicateItem(hook, "tcsmp:empty_grappling_hook");
        empty_hook.lockMode = ItemLockMode.slot;
        player.inventory.container.setItem(player.selectedSlotIndex, empty_hook);
    }, 1);

    // Instantiate Entities
    const view = player.getViewDirection(), head = player.getHeadLocation(), {dimension, location} = player;
    const stake = dimension.spawnEntity("tcsmp:grappling_hook_stake", add(head, mul(view, 2)));
    const seat = dimension.spawnEntity("tcsmp:grappling_hook_seat", location);
    const seat2 = dimension.spawnEntity("tcsmp:grappling_hook_seat", location);
    
    // Setup Leash & Rider
    seat.addRider(seat2);
    seat.leashTo(stake);
    stake.setDynamicProperty("seat", seat.id);
    
    // Fire Projectile
    stake.projectile.owner = player;
    stake.projectile.shoot(mul(view, 2));
    player.dimension.playSound("crossbow.shoot", head);


    // Check Distance
    const distanceCheck = system.runInterval(() => {
        if (distance(stake.location, player.getHeadLocation()) <= 48) {
            seat.teleport(player.location);
            return;
        }
        seat.remove();
        stake.remove();

        const slot = player.inventory.container.findIndex(isEmptyHook);
        const empty_hook = player.inventory.container.getItem(slot);
        const hook = duplicateItem(empty_hook, "tcsmp:grappling_hook");
        player.inventory.container.setItem(slot, hook);
        player.dimension.playSound("leashknot.break", player.getHeadLocation());

        system.clearRun(distanceCheck);
    });
    stake.setDynamicProperty("distcheck", distanceCheck);
});

world.afterEvents.projectileHitBlock.subscribe(({projectile: stake}) => {
    if (stake.typeId !== "tcsmp:grappling_hook_stake") return;
    if (!stake?.isValid()) return;
    system.clearRun(stake.getDynamicProperty("distcheck"));

    // Setup Retracttion
    const seat = world.getEntity(stake.getDynamicProperty("seat"));
    seat.teleport(add(seat.location, mul(Directions.Up, 0.1)));
    const player = stake.projectile.owner;
    const seat2 = seat.getRiders()[0];
    seat2.addRider(player);
    const head = player.getHeadLocation();
    player.dimension.playSound("leashknot.place", head);
    seat.triggerEvent("tcsmp:retract");

    const dist = distance(stake.location, head);
    player.playSound(GRAPPLE_SOUNDS[Math.floor(3 * dist / 48)]);

    // Dismount Check
    const dismountCheck = system.runInterval(() => {
        if (seat2.getRiders().length > 0) return;
        seat2.remove();
        seat.remove();
        stake.remove();

        // Decrement Durability
        const slot = player.inventory.container.findIndex(isEmptyHook);
        const empty_hook = player.inventory.container.getItem(slot);

        const creative = player.getGameMode() == GameMode.creative;
        const duplicate = duplicateItem(empty_hook, "tcsmp:grappling_hook");
        const hook = creative ? duplicate : decrementDurability(duplicate);

        player.inventory.container.setItem(slot, hook);
        if (!hook) player.dimension.playSound("random.break", player.getHeadLocation());
        else player.dimension.playSound("leashknot.break", player.getHeadLocation());

        system.clearRun(dismountCheck);
    });
});

/** @param {ItemStack} item */
function isEmptyHook(item) {
    return item?.typeId == "tcsmp:empty_grappling_hook";
}
