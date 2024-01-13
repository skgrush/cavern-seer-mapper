import { DoubleSide, FrontSide, Material, Side } from 'three';

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
