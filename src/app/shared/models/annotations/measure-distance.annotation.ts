import { BufferGeometry, Group, Line, LineBasicMaterial, LineSegments, Vector3 } from "three";
import { AnnotationType } from "../annotation-type.enum";
import { BaseAnnotation } from "./base.annotation";
import { RenderingOrder } from "../rendering-layers";
import { IMetadataMeasureDistanceV0 } from "../manifest/types.v0";
import { IMapperUserData } from "../user-data";


export class MeasureDistanceAnnotation extends BaseAnnotation {
  override readonly type = AnnotationType.measureDistance;

  readonly #line: Line;
  readonly #lineGroup: Group;
  readonly #additionalPoints: Vector3[];

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
    readonly identifier: string,
    readonly anchorPoint: Vector3,
    additionalPoints: readonly Vector3[],
  ) {
    super();
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
    this.#line.geometry = new BufferGeometry().setFromPoints([
      this.anchorPoint,
      ...this.#additionalPoints,
    ]);
  }

  override serializeToManifest(version: number): IMetadataMeasureDistanceV0 {
    if (version !== 0) {
      throw new RangeError(`MeasureDistanceAnnotation only supports manifest v0, got ${version}`);
    }
    const { x, y, z } = this.anchorPoint;

    return {
      type: AnnotationType.measureDistance,
      identifier: this.identifier,
      anchorPoint: { x, y, z },
      additionalPoints: this.#additionalPoints.map(({ x, y, z }) => ({ x, y, z })),
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
}
