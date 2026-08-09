import { Mat3, Matrix3, Vec3 } from "@madlad3718/mcveclib";
import { Vector3 } from "@minecraft/server";

export interface Ray3 {
    origin: Vector3,
    direction: Vector3
};

export interface Plane3 {
    origin: Vector3,
    normal: Vector3
};

export function intersect(ray: Ray3, plane: Plane3): Vector3 | undefined {
    const t = Vec3.dot(Vec3.sub(plane.origin, ray.origin), plane.normal)
            / Vec3.dot(ray.direction, plane.normal);

    if (t >= 0.0)
        return Vec3.add(Vec3.mul(ray.direction, t), ray.origin);
    else return undefined;
}

// Assumes all view vector sources don't have view tilt
// (Up vector equals Vec3 UP constant)
export function viewMatrix(view: Vector3): Matrix3 {
    const w = Math.abs(view.y) === 1.0 ? Vec3.South : view;
    const u = Vec3.normalize(Vec3.cross(Vec3.Up, w));
    return Mat3.from(u, Vec3.Up, view);
}
