import { DoubleSide, FrontSide, Material, Side } from 'three';

export class BaseMaterialService<T extends Material> {

  protected constructor(
    public readonly material: T
  ) { }

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
