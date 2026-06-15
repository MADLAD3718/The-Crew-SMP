import { EntityProjectileComponent, GameMode, ItemCustomComponent, ItemLockMode, ItemStack, Player, system, TicksPerSecond, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

const USE_TIME = TicksPerSecond * 1.0;
const MAX_DURATION = TicksPerSecond * 500;
const GRAPPLE_SOUNDS = [
    "grappling_hook.retract.short",
    "grappling_hook.retract.medium",
    "grappling_hook.retract.long",
]

world.afterEvents.itemReleaseUse.subscribe(event => {
    const { itemStack, source, useDuration } = event;
    if (itemStack?.typeId != "tcsmp:grappling_hook") return;

    source.stopSound("grappling_hook.loading.start");
    if (MAX_DURATION - useDuration < USE_TIME) return;

    const { inventory, dimension, location } = source;

    source.entityRidingOn?.ejectRider(source);

    const slot = inventory.container?.getSlot(source.selectedSlotIndex);

    const empty_hook = itemStack.clone("tcsmp:empty_grappling_hook");
    empty_hook.lockMode = ItemLockMode.slot;
    slot?.setItem(empty_hook);

    const view = source.getViewDirection(), head = source.getHeadLocation();
    const stake = dimension.spawnEntity("tcsmp:grappling_hook_stake", head);
    const seat = dimension.spawnEntity("tcsmp:grappling_hook_seat", location);
    const seat2 = dimension.spawnEntity("tcsmp:grappling_hook_seat", location);

    seat.addRider(seat2);
    seat.leashTo(stake);
    stake.setDynamicProperty("seat", seat.id);

    const projectile = stake.projectile as EntityProjectileComponent;
    projectile.owner = source;
    projectile.shoot(Vec3.mul(view, 2));
    source.dimension.playSound("grappling_hook.shoot", head);

    const interval = system.runInterval(() => {
        if (Vec3.distance(stake.location, source.getHeadLocation()) <= 48) {
            seat.teleport(source.location);
            return;
        }
        seat.remove();
        stake.remove();
        seat2.remove();

        const hook = slot?.getItem()?.clone("tcsmp:grappling_hook");
        slot?.setItem(hook);
        source.dimension.playSound("leashknot.break", source.getHeadLocation());

        system.clearRun(interval);
    });
    stake.setDynamicProperty("interval", interval);
});

world.afterEvents.projectileHitBlock.subscribe(({projectile: stake}) => {
    if (!stake.isValid) return;
    if (!stake.matches({type: "tcsmp:grappling_hook_stake"})) return;
    system.clearRun(stake.getDynamicProperty("interval") as number);

    const seat = world.getEntity(stake.getDynamicProperty("seat") as string);
    seat?.teleport(Vec3.above(seat.location, 0.1));

    const player = stake.projectile?.owner as Player;
    const seat2 = seat?.getRiders()[0];
    seat2?.addRider(player);

    const head = player.getHeadLocation();
    player.dimension.playSound("leashknot.place", head);
    seat?.triggerEvent("tcsmp:retract");

    // New leash mechanics cause the retraction to accelerate much faster, use the shortest sound instead
    // const dist = Vec3.distance(stake.location, head);
    // const sound = GRAPPLE_SOUNDS[Math.floor(3 * dist / 48)]
    const sound = GRAPPLE_SOUNDS[0];
    player.playSound(sound);

    const interval = system.runInterval(() => {
        if (seat2?.getRiders().length ?? 0 > 0) return;
        player.stopSound(sound);
        seat2?.remove();
        seat?.remove();
        stake.remove();

        const slot = player.inventory.container.firstMatch(item => item.typeId == "tcsmp:empty_grappling_hook")!;

        const hook = slot.getItem()!.clone("tcsmp:grappling_hook");
        hook.lockMode = ItemLockMode.none;
        slot.setItem(hook);
        slot.setItem(player.getGameMode() == GameMode.Creative ? hook : hook.damage());

        if (!slot?.hasItem())
            player.dimension.playSound(
                "random.break",
                player.getHeadLocation(),
                { pitch: 0.9 }
            );
        else player.dimension.playSound("leashknot.break", player.getHeadLocation());

        system.clearRun(interval);
    });
});

world.afterEvents.playerSpawn.subscribe(event => {
    const { player, initialSpawn } = event;
    if (!initialSpawn) return;

    system.runTimeout(() => {    
        if (!player.entityRidingOn?.matches({type: "tcsmp:grappling_hook_seat"})) return;
        const seat2 = player.entityRidingOn;
        const seat = seat2.entityRidingOn;
        const stake = seat?.leashHolder;
    
        seat2.ejectRider(player);
    
        seat2?.remove();
        seat?.remove();
        stake?.remove();
    
        const slot = player.inventory.container?.firstMatch(item => item.typeId == "tcsmp:empty_grappling_hook");
    
        let hook = slot?.getItem()?.clone("tcsmp:grappling_hook") as ItemStack;
        hook.lockMode = ItemLockMode.none;
        slot?.setItem(player.getGameMode() == GameMode.Creative ? hook : hook.damage());
    
        if (!slot?.hasItem())
            player.dimension.playSound("random.break", player.getHeadLocation());
        else player.dimension.playSound("leashknot.break", player.getHeadLocation());
    }, 5);
});

const grapplingHookComponent: ItemCustomComponent = {
    onUse({ source }) {
        const { dimension } = source;
        dimension.playSound("grappling_hook.loading.start", source.getHeadLocation());
    }
}

export default grapplingHookComponent;
