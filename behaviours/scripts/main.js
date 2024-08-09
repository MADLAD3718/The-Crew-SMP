import "./extensions/export";
import "./entities/cannon";
import "./entities/fire_cannonball";
import { system, world } from "@minecraft/server";
import { grapplingHookComponent } from "./items/grappling_hook";
import { waystoneComponent } from "./blocks/waystone";

system.afterEvents.scriptEventReceive.subscribe(event => {
    switch (event.id) {
        case "tcsmp:viewdp":
            console.warn(`World-specific dynamic property ids: [${world.getDynamicPropertyIds()}]`);
            break;
        case "tcsmp:cleardp":
            console.warn(`Cleared all world-specific dynamic properties.`);
            world.clearDynamicProperties();
    }
});

world.beforeEvents.worldInitialize.subscribe(event => {
    event.itemComponentRegistry.registerCustomComponent("tcsmp:grappling_hook", grapplingHookComponent);
    event.blockComponentRegistry.registerCustomComponent("tcsmp:waystone", waystoneComponent);
});
