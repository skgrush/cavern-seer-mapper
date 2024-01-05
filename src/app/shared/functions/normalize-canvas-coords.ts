import { Vector2 } from "three";

const m2 = new Vector2(2, -2);
const a1 = new Vector2(-1, 1);

/**
 * Convert canvas coordinates to... whatever these weird coordinates are.
 */
export function normalizeCanvasCoords(
  globalCoords: Vector2,
  globalDimensions: Vector2,
  subsetDimensions = globalDimensions,
  subsetOffset: Vector2 = new Vector2(),
) {
  return globalCoords.clone()
    .sub(subsetOffset)
    .divide(subsetDimensions)
    .multiply(m2)
    .add(a1);
}
