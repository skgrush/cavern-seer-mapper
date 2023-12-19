import { BufferGeometry, CircleGeometry, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, Vector3 } from "three";

import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { DigitsInfo } from "../../formatters/digits-info";
import { BaseAnnotation } from "./base.annotation";
import { droidSansFont } from "./font";
import { AnnotationType } from "../annotation-type.enum";
import { IMetadataCeilingHeightV0 } from "../manifest/types.v0";
import { RenderingLayers } from "../rendering-layers";


type LengthFormatter = (valueInMeters: number, digitsInfo?: DigitsInfo) => string;

export class CeilingHeightAnnotation extends BaseAnnotation {
  override readonly type = AnnotationType.ceilingHeight;

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

    const { textMesh, circleMesh } = this.#buildText(lengthFormat, distance);

    this.#lineGroup = new Group();
    this.#lineGroup.add(this.#line, textMesh, circleMesh);
    this.#lineGroup.position.copy(this.anchorPoint);
    this.#lineGroup.layers.enable(RenderingLayers.Annotation);
  }

  override serializeToManifest(version: number): IMetadataCeilingHeightV0 {
    if (version !== 0) {
      throw new RangeError('CeilingHeightAnnotation only supports manifest v0');
    }
    const { x, y, z } = this.anchorPoint;

    return {
      type: AnnotationType.ceilingHeight,
      identifier: this.identifier,
      anchorPoint: { x, y, z },
      distance: this.distance,
    };
  }

  override toggleVisibility(show: boolean): void {
    this.#lineGroup.visible = show;
  }

  override addToGroup(group: Group): void {
    group.add(this.#lineGroup);
  }
  override removeFromGroup(group: Group): void {
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

    const circleSize = centerOffset * 1.1;
    const circleGeometry = new CircleGeometry(circleSize, 24);
    const circleMesh = new Mesh(circleGeometry, new MeshBasicMaterial({ color: 0xFFFFFF }));
    circleMesh.position.set(0, this.distance, 0);
    circleMesh.rotation.set(-Math.PI / 2, 0, 0);

    const textMesh = new Mesh(textGeometry, new MeshBasicMaterial({ color: 0x00 }));
    textMesh.position.set(centerOffset, this.distance + size / 5, size / 2);
    textMesh.rotation.set(-Math.PI / 2, 0, 0);

    return {
      circleMesh,
      textMesh,
    };
  }
}
