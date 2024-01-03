import type { Object3D } from "three";

export function traverseMatrixUpdate(
  entity: Object3D,
  { matrixWorldAutoUpdate, matrixAutoUpdate, shouldUpdateMatrix }: {
    matrixWorldAutoUpdate?: boolean,
    matrixAutoUpdate?: boolean,
    shouldUpdateMatrix?: boolean,
  }) {
  type Fn = undefined | ((o: Object3D) => void);

  let setMatrixWorldAutoUpdate: Fn;
  if (matrixWorldAutoUpdate !== undefined) {
    setMatrixWorldAutoUpdate = o => o.matrixWorldAutoUpdate = matrixWorldAutoUpdate;
  }

  let setMatrixAutoUpdate: Fn;
  if (matrixAutoUpdate !== undefined) {
    setMatrixAutoUpdate = o => o.matrixAutoUpdate = matrixAutoUpdate;
  }

  let updateMatrix: Fn;
  if (shouldUpdateMatrix) {
    updateMatrix = o => o.updateMatrix();
  }

  function fn(o: Object3D) {
    setMatrixWorldAutoUpdate?.(o);
    setMatrixAutoUpdate?.(o);
    updateMatrix?.(o);
  }

  fn(entity);
  entity.traverse(fn);
}
