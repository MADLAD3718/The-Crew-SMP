import { ItemCustomComponent, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";
import { WaystoneRegistry } from "../systems/waystones";

world.beforeEvents.itemUse.subscribe(event => {
    const { itemStack, source } = event;
    if (itemStack.typeId != "tcsmp:scroll_of_return") return;

    const waystones = WaystoneRegistry.get(source);
    if (waystones.length == 0) {
        source.sendMessage({translate: "info.return_scroll.no_waystones"});
        event.cancel = true;
    }
});

const returnSpellComponent: ItemCustomComponent = {
    onUse({ source }) {
        const closest = WaystoneRegistry.get(source).reduce((current, next) => {
            if (Vec3.distance(next.location, source.location) < Vec3.distance(current.location, source.location))
                return next;
            else return current;
        });

        source.playSound("waystone.teleport");
        source.camera.fade({
            fadeColor: {red: 0.914, green: 0.882, blue: 0.851},
            fadeTime: {
                fadeInTime: 0.0,
                holdTime: 1.0,
                fadeOutTime: 0.8
            }
        });
        source.teleport(closest.location);
    }
}

export default returnSpellComponent;
