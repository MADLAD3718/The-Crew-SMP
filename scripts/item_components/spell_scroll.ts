import { ItemCustomComponent, MolangVariableMap } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";
import { randomRange } from "../util";

type SpellScrollParameters = {
    spell_colour: number[];
}

const spellScrollComponent: ItemCustomComponent = {
    onUse({ source }, parameters) {
        const { params } = parameters as { params: SpellScrollParameters };
        const { dimension } = source;

        source.stopSound("random.bow");
        const head = source.getHeadLocation();
        dimension.playSound("scroll.cast", head, {
            pitch: randomRange(0.95, 1.05)
        });

        const vars = new MolangVariableMap();
        const colour = Vec3.toRGB(Vec3.from(params.spell_colour));
        vars.setColorRGB("colour", colour);
        dimension.spawnParticle("tcsmp:spell_cast", head, vars);
    }
}

export default spellScrollComponent;
