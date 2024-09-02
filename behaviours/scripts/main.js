import "./items/katana";
import "./items/cannabis_bow";
import "./items/lightning_bottle";
import "./entities/cannon";
import "./entities/cannabis_arrow";
import "./entities/fire_cannonball";
import "./entities/lightning_cannonball";
import { system, world } from "@minecraft/server";
import { waystoneComponent } from "./blocks/waystone";
import { grapplingHookComponent } from "./items/grappling_hook";
import { growthSpellComponent } from "./items/scroll_of_growth";
import { thunderSpellComponent } from "./items/scroll_of_thunder";
import { decaySpellComponent } from "./items/scroll_of_decay";
import { returnSpellComponent } from "./items/scroll_of_return";

system.afterEvents.scriptEventReceive.subscribe(event => {
    switch (event.id) {
        case "tcsmp:viewdp":
            console.warn(`World-specific dynamic property ids: [${world.getDynamicPropertyIds()}]`);
            break;
        case "tcsmp:cleardp":
            console.warn(`Cleared all world-specific dynamic properties.`);
            world.clearDynamicProperties();
            break;
    }
});

world.beforeEvents.worldInitialize.subscribe(event => {
    const {itemComponentRegistry, blockComponentRegistry} = event;
    blockComponentRegistry.registerCustomComponent("tcsmp:waystone", waystoneComponent);
    itemComponentRegistry.registerCustomComponent("tcsmp:grappling_hook", grapplingHookComponent);
    itemComponentRegistry.registerCustomComponent("tcsmp:growth_spell", growthSpellComponent);
    itemComponentRegistry.registerCustomComponent("tcsmp:thunder_spell", thunderSpellComponent);
    itemComponentRegistry.registerCustomComponent("tcsmp:decay_spell", decaySpellComponent);
    itemComponentRegistry.registerCustomComponent("tcsmp:return_spell", returnSpellComponent);
});
