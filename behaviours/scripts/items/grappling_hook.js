import { EntityComponentTypes, GameMode, ItemLockMode, ItemStack, Player, system, TicksPerSecond, world } from "@minecraft/server";
import { add, distance, mul } from "../extensions/vectors";

const USE_TIME = 1.0 * TicksPerSecond;

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
    const empty_hook = new ItemStack("tcsmp:empty_grappling_hook");
    empty_hook.durability.damage = hook.durability.damage;
    empty_hook.lockMode = ItemLockMode.slot;
    player.inventory.container.setItem(player.selectedSlotIndex, empty_hook);
    player.setDynamicProperty("grapple_slot", player.selectedSlotIndex);

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

        const slot = player.getDynamicProperty("grapple_slot");
        const empty_hook = player.inventory.container.getItem(slot);
        const hook = new ItemStack("tcsmp:grappling_hook");
        hook.durability.damage = empty_hook.durability.damage;
        player.inventory.container.setItem(slot, hook);
        player.dimension.playSound("leashknot.break", player.getHeadLocation());

        system.clearRun(distanceCheck);
    });
    stake.setDynamicProperty("dist_check", distanceCheck);
});

world.afterEvents.projectileHitBlock.subscribe(({projectile: stake}) => {
    if (stake.typeId !== "tcsmp:grappling_hook_stake") return;
    system.clearRun(stake.getDynamicProperty("dist_check"));

    // Setup Retracttion
    const seat = world.getEntity(stake.getDynamicProperty("seat"));
    /** @type {Player} */
    const player = stake.getComponent(EntityComponentTypes.Projectile).owner;
    const seat2 = seat.getComponent(EntityComponentTypes.Rideable).getRiders()[0];
    seat2.getComponent(EntityComponentTypes.Rideable).addRider(player);
    player.dimension.playSound("leashknot.place", player.getHeadLocation());
    seat.triggerEvent("tcsmp:retract");

    // Dismount Check
    const dismountCheck = system.runInterval(() => {
        const rider_count = seat2.getComponent(EntityComponentTypes.Rideable).getRiders().length;
        if (rider_count > 0) return;
        seat2.remove();
        seat.remove();
        stake.remove();

        // Decrement Durability
        const slot = player.getDynamicProperty("grapple_slot");
        const empty_hook = player.inventory.container.getItem(slot);
        if (empty_hook.durability.damage == empty_hook.durability.maxDurability) {
            player.inventory.container.setItem(slot);
            player.dimension.playSound("random.break", player.getHeadLocation());
        } else {
            const hook = new ItemStack("tcsmp:grappling_hook");
            if (player.getGameMode() != GameMode.creative) 
                hook.durability.damage = empty_hook.durability.damage + 1;
            player.inventory.container.setItem(slot, hook);
            player.dimension.playSound("leashknot.break", player.getHeadLocation());
        }

        system.clearRun(dismountCheck);
    });
});
