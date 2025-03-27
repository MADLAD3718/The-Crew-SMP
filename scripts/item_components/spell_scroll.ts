import { ItemCustomComponent, MolangVariableMap, WorldSoundOptions } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

const spellScrollComponent: ItemCustomComponent = {
    onUse({ source, itemStack }) {
        const { dimension } = source;

        source.stopSound("random.bow");
        const head = source.getHeadLocation();
        const soundOptions: WorldSoundOptions = { pitch: 0.95 + 0.1 * Math.random() };
        dimension.playSound("scroll.cast", head, soundOptions);

        const vars = new MolangVariableMap();
        const colour = Vec3.toRGB(Vec3.parse(itemStack?.getTagProperty("colour") as string))
        vars.setColorRGB("colour", colour);
        dimension.spawnParticle("tcsmp:spell_cast", head, vars);
    }
}

export default spellScrollComponent;
