import { Vector2, Vector3 } from "@minecraft/server";
import { NumberRange } from "@minecraft/common"
import { Vec3 } from "@madlad3718/mcveclib";

export class MissingComponentError extends Error {
    constructor(component: string) {
        super(`Object is missing component "${component}".`);
        this.name = "MissingComponentError";
    }
}

export function within(value: number, range: NumberRange): boolean {
    return range.min <= value && value <= range.max;
}

export function lerp(t: number, a: number, b: number) {
    return a + t * (b - a);
}

/**
 * Picks an element at random from an array.
 * @param array The specified array.
 * @returns A random element from the array.
 */
export function randElement<type>(array: type[]): type {
    return array[Math.floor(Math.random() * array.length)];
}

export function randBoundedDisk(min: number, max: number): Vector2 {
    const theta = 2 * Math.PI * Math.random();
    const min2 = min * min, max2 = max * max;
    const radius = Math.sqrt(lerp(Math.random(), min2, max2));
    return {
        x: radius * Math.cos(theta),
        y: radius * Math.sin(theta)
    };
}

export function ellipsoidValue(range: Vector3, position: Vector3): number {
    const pos2 = Vec3.mul(position, position);
    const ran2 = Vec3.mul(range, range);
    const quo = Vec3.div(pos2, ran2);
    return quo.x + quo.y + quo.z;
}

/**
 * Generates a list of locations bounded by a rectangular prism.
 * @param range The length of each semi-axis.
 * @returns A list of locations within a rectangular prism centered about the origin.
 */
export function getRectPrism(range: Vector3): Vector3[] {
    const span = Vec3.add(Vec3.mul(range, 2), Vec3.from(1));
    const locations = new Array(span.x * span.y * span.z);
    let i = 0;
    for (let x = 0; x <= 2 * range.x; ++x)
    for (let y = 0; y <= 2 * range.y; ++y)
    for (let z = 0; z <= 2 * range.z; ++z, ++i)
        locations[i] = Vec3.sub(Vec3.from(x, y, z), range);
    return locations;
}
