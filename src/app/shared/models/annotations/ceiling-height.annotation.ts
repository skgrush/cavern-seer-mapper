import { BufferGeometry, Group, Line, LineBasicMaterial, Vector3 } from "three";
import { BaseAnnotation } from "./base.annotation";



export class CeilingHeightAnnotation extends BaseAnnotation {
  override readonly identifier: string;
  override readonly anchorPoint: Vector3;
  readonly distance: number;

  readonly #line: Line;
  readonly #lineGroup: Group;

  constructor(
    identifier: string,
    floorPointRelativeToParent: Vector3,
    distance: number,
  ) {
    super();
    this.identifier = identifier;
    this.anchorPoint = floorPointRelativeToParent;
    this.distance = distance;

    const material = new LineBasicMaterial({ color: 0xFF0000 });
    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(),
      new Vector3(0, this.distance, 0),
    ]);
    this.#line = new Line(
      geometry,
      material,
    );
    this.#lineGroup = new Group();
    this.#lineGroup.add(this.#line);
    this.#lineGroup.position.copy(this.anchorPoint);

    debugger;
  }

  addToGroup(group: Group): void {
    group.add(this.#lineGroup);
  }
  removeFromGroup(group: Group): void {
    group.remove(this.#lineGroup);
  }
}
