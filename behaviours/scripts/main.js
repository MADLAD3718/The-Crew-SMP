import "./extensions/export";
import { world } from "@minecraft/server";
import { grapplingHookComponent } from "./items/grappling_hook";

world.beforeEvents.worldInitialize.subscribe(event => {
    event.itemComponentRegistry.registerCustomComponent("tcsmp:grappling_hook", grapplingHookComponent);
});
