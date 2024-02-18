import { Color, Vector3 } from 'three';


export function colorToVector3(color: Color) {
  return new Vector3(
    color.r,
    color.g,
    color.b,
  );
}
