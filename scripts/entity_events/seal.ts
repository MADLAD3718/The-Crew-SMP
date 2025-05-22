import { Entity, EntityComponentTypes, Player, system, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

world.afterEvents.dataDrivenEntityTrigger.subscribe(event => {
    const rider = event.entity.getRiders()[0] as Player | undefined;
    if (!rider) return;
    startSealInput(event.entity, rider);
}, {eventTypes: ["tcsmp:mounted"]});

world.afterEvents.playerSpawn.subscribe(({ initialSpawn, player }) => {
    if (!initialSpawn) return;
    player.setProperty("tcsmp:ride_anim", "default");

    system.runTimeout(() => {
        const ridden = player.entityRidingOn;
        if (!ridden || !ridden.matches({type: "tcsmp:seal"})) return;
        startSealInput(ridden, player);
    }, 10);
});

function startSealInput(seal: Entity, player: Player): void {
    player.setProperty("tcsmp:ride_anim", "seal");
    const interval = system.runInterval(() => {
        if (!player.entityRidingOn) {
            player.setProperty("tcsmp:ride_anim", "default");
            seal.triggerEvent("tcsmp:dismounted");
            return system.clearRun(interval);
        }

        if (!seal.hasComponent(EntityComponentTypes.Rideable)) {
            player.setProperty("tcsmp:ride_anim", "default");
            seal.triggerEvent("tcsmp:dismounted");
            return system.clearRun(interval);
        }

        const input = player.inputInfo.getMovementVector();
        if (!input.y) return;
        
        const view = player.getViewDirection();
        seal.applyImpulse(Vec3.from(0, 0.05 * input.y * view.y, 0));
    });
}
