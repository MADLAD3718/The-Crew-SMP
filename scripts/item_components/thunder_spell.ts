import { ItemCustomComponent, MinecraftDimensionTypes, WeatherType, world } from "@minecraft/server";
import { Vec2, Vec3 } from "@madlad3718/mcveclib";
import { randBoundedDisk } from "../util";

const BOLT_COUNT = 12;

world.beforeEvents.itemUse.subscribe(event => {
    const { source, itemStack } = event, { dimension } = source;
    if (itemStack.typeId != "tcsmp:scroll_of_thunder") return;
    
    event.cancel = dimension.id != MinecraftDimensionTypes.overworld;
});

const thunderSpellComponent: ItemCustomComponent = {
    onUse({ source }) {
        const { dimension } = source, head = source.getHeadLocation();

        for (let i = 0; i < BOLT_COUNT; ++i) {
            const sample = Vec2.toVectorXZ(randBoundedDisk(5, 15));
            const target = Vec3.add(head, Vec3.fromVectorXZ(sample));
            const block = dimension.getTopmostBlock(target, head.y + 2);
            if (!block) continue;
            const spawn_location = Vec3.above(block.bottomCenter());
            dimension.spawnEntity("minecraft:lightning_bolt", spawn_location);
        }
    
        dimension.setWeather(WeatherType.Thunder);
    }
}

export default thunderSpellComponent;
