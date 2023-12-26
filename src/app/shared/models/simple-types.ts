import { Vector3 } from "three";

export type ISimpleVector3 = {
  readonly x: number,
  readonly y: number,
  readonly z: number,
}

export function vector3FromSimpleVector3(
  { x, y, z }: ISimpleVector3,
): Vector3 {
  return new Vector3(x, y, z);
}

export function simpleVector3FromVector3(
  { x, y, z }: Vector3,
): ISimpleVector3 {
  return { x, y, z };
}
