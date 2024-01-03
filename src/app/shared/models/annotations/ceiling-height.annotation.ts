import { BufferGeometry, CircleGeometry, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, Vector3 } from "three";

import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { LocalizeService } from "../../services/localize.service";
import { AnnotationType } from "../annotation-type.enum";
import { IMetadataCeilingHeightV0 } from "../manifest/types.v0";
import { RenderingOrder } from "../rendering-layers";
import { simpleVector3FromVector3 } from "../simple-types";
import { IMapperUserData } from "../user-data";
import { BaseAnnotation } from "./base.annotation";
import { droidSansFont } from "./font";
import { traverseMatrixUpdate } from "../../functions/traverse-matrix-update";

export class CeilingHeightAnnotation extends BaseAnnotation {
  override readonly type = AnnotationType.ceilingHeight;
  override readonly mustBeAttachedToMesh = true;

  readonly #whitespaceRe = /\s+/u;

  #identifier: string;
  readonly #line: Line;
  readonly #lineGroup: Group;

  get identifier() {
    return this.#identifier;
  }

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
    identifier: string,
    readonly anchorPoint: Vector3,
    readonly distance: number,
    readonly localize: LocalizeService,
  ) {
    super();
    this.#identifier = identifier;

    const material = new LineBasicMaterial({ color: 0xFFFFFF });
    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(),
      new Vector3(0, this.distance, 0),
    ]);
    this.#line = new Line(
      geometry,
      material,
    );

    const { textMesh, circleMesh } = this.#buildText(localize, distance);

    this.#lineGroup = new Group();
    this.#lineGroup.add(this.#line, textMesh, circleMesh);
    this.#lineGroup.position.copy(this.anchorPoint);
    traverseMatrixUpdate(this.#lineGroup, {
      matrixAutoUpdate: false,
      matrixWorldAutoUpdate: false,
      shouldUpdateMatrix: true,
    });

    (this.#lineGroup.userData as IMapperUserData).isAnnotationGroup = true;

    material.depthTest = false;
    this.#lineGroup.renderOrder = RenderingOrder.Annotation;
  }

  override rename(newIdentifier: string): void {
    this.#identifier = newIdentifier;
  }

  override serializeToManifest(version: number): IMetadataCeilingHeightV0 {
    if (version !== 0) {
      throw new RangeError(`CeilingHeightAnnotation only supports manifest v0, got ${version}`);
    }

    return {
      type: AnnotationType.ceilingHeight,
      identifier: this.identifier,
      anchorPoint: simpleVector3FromVector3(this.anchorPoint),
      distance: this.distance,
    };
  }

  override toggleVisibility(show: boolean): void {
    this.#lineGroup.visible = show;
  }

  override addToGroup(group: Group): void {
    group.add(this.#lineGroup);
    traverseMatrixUpdate(this.#lineGroup, { shouldUpdateMatrix: true });
  }
  override removeFromGroup(group: Group): void {
    group.remove(this.#lineGroup);
  }

  #buildText(localize: LocalizeService, distance: number) {
    const size = 0.1;

    const textGeometry = new TextGeometry(
      localize.formatLength(distance, 0, 1).replace(this.#whitespaceRe, ' '),
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
