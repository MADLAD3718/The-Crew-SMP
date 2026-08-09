import { ItemCustomComponent, TicksPerSecond } from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";

const nauseaSpellComponent: ItemCustomComponent = {
    onUse({ source }) {
        if (!source.isValid) return;

        const { dimension, location } = source;
        for (const entity of dimension.getEntities({ location, maxDistance: 10 })) {
            entity.addEffect(MinecraftEffectTypes.Nausea, 30 * TicksPerSecond);
        }
    }
};

export default nauseaSpellComponent;
