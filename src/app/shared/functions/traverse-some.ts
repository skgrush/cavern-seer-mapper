import type { Object3D } from "three";

/**
 * Run the `fn` against this object and its children, recursively.
 * Return `true` when the first call to `fn` returns `true`.
 */
export function traverseSome(obj: Object3D, fn: (o: Object3D) => boolean): boolean {
  return (
    fn(obj) ||
    obj.children.some(child => traverseSome(child, fn))
  );
}
