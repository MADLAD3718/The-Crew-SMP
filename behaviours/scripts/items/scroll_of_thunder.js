import { ItemComponentUseEvent, MolangVariableMap, WeatherType } from "@minecraft/server";
import { add, Directions } from "../extensions/vectors";
import "../extensions/entities";

const LIGHTNING_COUNT = 12;

/** @type {import("@minecraft/server").ItemCustomComponent} */
export const thunderSpellComponent = {
    onUse: useThunderSpell
}

/** @param {ItemComponentUseEvent} event  */
function useThunderSpell(event) {
    const {source} = event, {dimension, locationXZ} = source;
    source.stopSound("random.bow");
    const head = source.getHeadLocation();
    const soundOptions = {pitch: 0.95 + 0.1 * Math.random()};
    dimension.playSound("scroll.cast", head, soundOptions);

    const vars = new MolangVariableMap();
    vars.setColorRGB("colour", {red: 0.9, green: 0.9, blue: 1.0});
    dimension.spawnParticle("tcsmp:spell_cast", head, vars);

    for (let i = 0; i < LIGHTNING_COUNT; ++i) {
        const sample = randBoundedDisc(5, 15);
        const posXZ = addXZ(sample, locationXZ);
        const block = dimension.getTopmostBlock(posXZ, head.y + 2);
        if (!block) continue;
        const spawn_location = add(block.bottomCenter(), Directions.Up);
        dimension.spawnEntity("minecraft:lightning_bolt", spawn_location);
    }

    dimension.setWeather(WeatherType.Thunder);
}

/** @typedef {{x: Number, z: Number}} VectorXZ */

/**
 * Generates a random uniformly distributed point on a bounded disc.
 * @param {Number} min The minimum radius on the disc.
 * @param {Number} max The maximum radius on the disc.
 * @returns {VectorXZ}
 */
function randBoundedDisc(min, max) {
    const theta = 2 * Math.PI * Math.random();
    const min2 = min * min, max2 = max * max;
    const radius = Math.sqrt(min2 + Math.random() * (max2 - min2));
    return {
        x: radius * Math.cos(theta),
        y: 0,
        z: radius * Math.sin(theta)
    };
}

/**
 * Adds two XZ vectors together.
 * @param {VectorXZ} u 
 * @param {VectorXZ} v 
 * @returns {VectorXZ}
 */
function addXZ(u, v) {
    return {
        x: u.x + v.x,
        z: u.z + v.z
    }
}
