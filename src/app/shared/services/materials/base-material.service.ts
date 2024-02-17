import { DoubleSide, FrontSide, Material, Side } from 'three';
import { InjectionToken } from '@angular/core';

export const MATERIAL_SERVICES = new InjectionToken<readonly BaseMaterialService<any>[]>('material-services');

export abstract class BaseMaterialService<T extends Material> {
  abstract readonly material: T;

  setSide(side: Side) {
    this.material.side = side;
  }

  toggleDoubleSide() {
    const newValue =
      this.material.side === FrontSide
        ? DoubleSide
        : FrontSide;

    this.material.side = newValue;
    return newValue;
  }
}
