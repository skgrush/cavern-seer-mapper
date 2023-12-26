import { ISimpleVector3 } from "../models/simple-types";

export function simpleVector3Equality(a: Partial<ISimpleVector3>, b: Partial<ISimpleVector3>) {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.z === b.z
  );
}
