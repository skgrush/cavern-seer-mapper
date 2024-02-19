import { DoubleSide, FrontSide, Material, Mesh, Side } from 'three';
import { InjectionToken } from '@angular/core';

export const MATERIAL_SERVICES = new InjectionToken<readonly BaseMaterialService<any>[]>('material-services');

export abstract class BaseMaterialService<T extends Material | Material[]> {
  abstract readonly material: T;
  abstract readonly type: string;
  abstract readonly description: string;

  setSide(side: Side) {
    if (this.material instanceof Material) {
      this.material.side = side;
    } else {
      for (const material of this.material as Material[]) {
        material.side = side;
      }
    }
  }

  updateMesh(mesh: Mesh) {
    mesh.material = this.material;
    if (Array.isArray(this.material)) {
      for (let i = 0; i < this.material.length; ++i) {
        mesh.geometry.addGroup(0, Infinity, i);
      }
    } else {
      mesh.geometry.clearGroups();
    }
  }

  toggleDoubleSideFrom(previousSide: Side) {
    const newSide =
      previousSide === FrontSide
        ? DoubleSide
        : FrontSide;

    this.setSide(newSide);
    return newSide;
  }
}
