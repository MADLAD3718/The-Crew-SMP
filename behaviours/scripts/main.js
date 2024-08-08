import "./extensions/export";
import "./entities/cannon";
import "./entities/fire_cannonball";
import { world } from "@minecraft/server";
import { grapplingHookComponent } from "./items/grappling_hook";

world.beforeEvents.worldInitialize.subscribe(event => {
    event.itemComponentRegistry.registerCustomComponent("tcsmp:grappling_hook", grapplingHookComponent);
});
