import type { Float4x4 } from "@skgrush/bplist-and-nskeyedunarchiver/NSKeyedUnarchiver";
import { Matrix4 } from "three";

/**
 * Three.js's {@link Matrix4} is stored in a transposed form from our normal matrices.
 * This converts from Float4x4 to Matrix4.
 */
export function float4x4ToMatrix4(float4x4: Float4x4) {
  const float4x4Elements = float4x4.flat() as [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
  if (float4x4Elements.length !== 16) {
    throw new Error('float4x4 did not contain 16 elements');
  }
  return new Matrix4(...float4x4Elements).transpose();
}
