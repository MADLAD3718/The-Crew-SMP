import { EntityComponentTypes, system, world } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";

const FoodTickTimer: Record<string, number> = {};

world.afterEvents.entityHurt.subscribe(({ hurtEntity: player }) => {
    FoodTickTimer[player.id] = 0;
}, { entityTypes: [MinecraftEntityTypes.Player] });

world.afterEvents.worldLoad.subscribe(() => {
    world.gameRules.naturalRegeneration = false;
    system.runInterval(() => {
        system.runJob(handlePlayerHealing());
    });
});

function* handlePlayerHealing(): Generator<void, void, void> {
    for (const player of world.getAllPlayers()) {
        const health = player.getComponent(EntityComponentTypes.Health)!;
        if (health.currentValue === health.effectiveMin) {
            FoodTickTimer[player.id] = Infinity;
            return player.onScreenDisplay.setTitle("flash: off");
        }

        const foodTickTimer = FoodTickTimer[player.id] ?? 0;
        FoodTickTimer[player.id] = foodTickTimer + 1;
        
        if (foodTickTimer < 6) {
            if (Math.floor(foodTickTimer / 2) % 2 === 0)
                player.onScreenDisplay.setTitle("flash: on");
            else player.onScreenDisplay.setTitle("flash: off");
        }
        else if (foodTickTimer === 6)
            player.onScreenDisplay.setTitle("flash: off");

        if (health.currentValue === health.effectiveMax) continue;

        const hunger = player.getComponent(EntityComponentTypes.Hunger)!;
        if (hunger.currentValue <= 17) continue;

        const saturation = player.getComponent(EntityComponentTypes.Saturation)!;

        const healDelay = hunger.currentValue === hunger.effectiveMax &&
            saturation.currentValue >= saturation.effectiveMin + 1.5 ? 10 : 80;

        if (FoodTickTimer[player.id] < healDelay) continue;
        FoodTickTimer[player.id] = 0;
        player.onScreenDisplay.setTitle("flash: on");

        health.setCurrentValue(Math.min(health.currentValue + 1, health.effectiveMax));

        const exhaustion = player.getComponent(EntityComponentTypes.Exhaustion)!;
        exhaustion.setCurrentValue(Math.min(exhaustion.currentValue + 6, exhaustion.effectiveMax));

        yield;
    }
}
