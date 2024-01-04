import { BufferGeometry, Group, Line, LineBasicMaterial, Vector3 } from "three";
import { AnnotationType } from "../annotation-type.enum";
import { IMetadataMeasureDistanceV0 } from "../manifest/types.v0";
import { RenderingOrder } from "../rendering-layers";
import { simpleVector3FromVector3 } from "../simple-types";
import { IMapperUserData } from "../user-data";
import { BaseAnnotation } from "./base.annotation";
import { traverseMatrixUpdate } from "../../functions/traverse-matrix-update";


export class MeasureDistanceAnnotation extends BaseAnnotation {
  override readonly type = AnnotationType.measureDistance;
  override readonly mustBeAttachedToMesh = true;

  #identifier: string;
  readonly #line: Line;
  readonly #lineGroup: Group;
  readonly #additionalPoints: Vector3[];

  get identifier() {
    return this.#identifier;
  }

  get worldPoint() {
    return this.#lineGroup.getWorldPosition(new Vector3());
  }

  get allPoints() {
    return [
      this.anchorPoint,
      ...this.#additionalPoints,
    ];
  }

  get distance() {
    if (this.#additionalPoints.length === 0) {
      return 0;
    }
    let distance = 0;
    let previousPoint = this.anchorPoint;
    for (const point of this.#additionalPoints) {
      distance += point.distanceTo(previousPoint);
      previousPoint = point;
    }
    return distance;
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
    additionalPoints: readonly Vector3[],
  ) {
    super();
    this.#identifier = identifier;
    this.#additionalPoints = [...additionalPoints];

    const material = new LineBasicMaterial({ color: 0xFFFFFF });
    const geometry = new BufferGeometry().setFromPoints([
      anchorPoint,
      ...additionalPoints,
    ]);

    this.#line = new Line(
      geometry,
      material,
    );

    this.#lineGroup = new Group();
    this.#lineGroup.add(this.#line);
    traverseMatrixUpdate(this.#lineGroup, {
      matrixAutoUpdate: false,
      matrixWorldAutoUpdate: false,
      shouldUpdateMatrix: true,
    });

    (this.#lineGroup.userData as IMapperUserData).isAnnotationGroup = true;

    material.depthTest = false;
    this.#lineGroup.renderOrder = RenderingOrder.Annotation;
  }

  worldToLocal(worldPoint: Vector3) {
    if (!this.#lineGroup.parent) {
      throw new Error('cannot MeasureDistanceAnnotation#addNewPoint() when detached');
    }
    return this.#lineGroup.worldToLocal(worldPoint.clone());
  }
  localToWorld(localPoint: Vector3) {
    return this.#lineGroup.localToWorld(localPoint.clone());
  }

  addNewWorldPoint(worldPoint: Vector3) {
    const pointRelative = this.worldToLocal(worldPoint.clone());
    this.#additionalPoints.push(pointRelative);

    this.#rebuildGeometry();
  }

  /**
   * Delete these points from the measure.
   * Cannot delete the first item.
   * Vectors must be the **same instance** to be deleted.
   */
  deletePoints(points: readonly Vector3[]) {
    for (const point of points) {
      const idx = this.#additionalPoints.indexOf(point);
      if (idx === -1) {
        continue;
      }
      if (idx === 0) {
        console.warn('Attempt to delete anchor point from MeasureDistanceAnnotation');
        continue;
      }
      this.#additionalPoints.splice(idx, 1);
    }

    this.#rebuildGeometry();
  }

  #rebuildGeometry() {
    this.#line.geometry = new BufferGeometry().setFromPoints([
      this.anchorPoint,
      ...this.#additionalPoints,
    ]);
    this.#line.updateMatrix();
    this.#line.updateMatrixWorld();
  }

  override rename(newIdentifier: string): void {
    this.#identifier = newIdentifier;
  }

  override serializeToManifest(version: number): IMetadataMeasureDistanceV0 {
    if (version !== 0) {
      throw new RangeError(`MeasureDistanceAnnotation only supports manifest v0, got ${version}`);
    }

    return {
      type: AnnotationType.measureDistance,
      identifier: this.identifier,
      anchorPoint: simpleVector3FromVector3(this.anchorPoint),
      additionalPoints: this.#additionalPoints.map(simpleVector3FromVector3),
    };
  }

  override toggleVisibility(show: boolean): void {
    this.#lineGroup.visible = show;
  }

  override addToGroup(group: Group): void {
    group.add(this.#lineGroup);
    this.#lineGroup.updateMatrix();
    this.#lineGroup.updateMatrixWorld();
  }
  override removeFromGroup(group: Group): void {
    group.remove(this.#lineGroup);
  }
}
