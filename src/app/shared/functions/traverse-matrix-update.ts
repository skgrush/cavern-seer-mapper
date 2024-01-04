import type { Object3D } from "three";

export function traverseMatrixUpdate(entity: Object3D) {
  entity.updateMatrixWorld(true);
  entity.updateMatrix();
}
