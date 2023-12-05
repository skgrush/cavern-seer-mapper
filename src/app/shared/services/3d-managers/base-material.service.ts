import { DoubleSide, FrontSide, Material, Scene, Side } from 'three';

export class BaseMaterialService<T extends Material> {

  protected constructor(
    public readonly material: T
  ) { }

  setSide(side: Side) {
    this.material.side = side;
  }

  toggleDoubleSide() {
    this.material.side =
      this.material.side === FrontSide
        ? DoubleSide
        : FrontSide;
  }
}
