import { BufferGeometry, Group, Line, LineBasicMaterial, Mesh, MeshPhongMaterial, Vector3 } from "three";

import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { DigitsInfo } from "../../formatters/digits-info";
import { BaseAnnotation } from "./base.annotation";
import { droidSansFont } from "./font";


type LengthFormatter = (valueInMeters: number, digitsInfo?: DigitsInfo) => string;

export class CeilingHeightAnnotation extends BaseAnnotation {
  readonly #line: Line;
  readonly #lineGroup: Group;

  get worldPoint() {
    const vector = new Vector3();
    return this.#lineGroup.getWorldPosition(vector);
  }

  get firstParentName() {
    let group = this.#lineGroup.parent;
    while (group) {
      if (group.name) {
        return group.name;
      }
      group = group.parent;
    }
    return null;
  }

  constructor(
    readonly identifier: string,
    readonly anchorPoint: Vector3,
    readonly distance: number,
    readonly lengthFormat: LengthFormatter,
  ) {
    super();

    const material = new LineBasicMaterial({ color: 0xFFFFFF });
    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(),
      new Vector3(0, this.distance, 0),
    ]);
    this.#line = new Line(
      geometry,
      material,
    );

    const textMesh = this.#buildText(lengthFormat, distance);

    this.#lineGroup = new Group();
    this.#lineGroup.add(this.#line, textMesh);
    this.#lineGroup.position.copy(this.anchorPoint);
  }

  addToGroup(group: Group): void {
    group.add(this.#lineGroup);
  }
  removeFromGroup(group: Group): void {
    group.remove(this.#lineGroup);
  }

  #buildText(lengthFormat: LengthFormatter, distance: number) {
    const size = 0.1;

    const textGeometry = new TextGeometry(
      lengthFormat(distance, '1.0-1'),
      {
        font: droidSansFont,
        size,
        height: size / 5,
      }
    );

    textGeometry.computeBoundingBox();
    const centerOffset = - 0.5 * (textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x);

    const textMesh = new Mesh(textGeometry, new MeshPhongMaterial({ color: 0xFFFFFF }));

    textMesh.position.set(centerOffset, this.distance + size / 2, size / 2);
    textMesh.rotation.set(-Math.PI / 2, 0, 0);

    return textMesh;
  }
}
