import { Vector3, Group, Object3DEventMap, Box3, BoxGeometry, Mesh, MeshBasicMaterial } from "three";
import { AnnotationType } from "../annotation-type.enum";
import { IMetadataBaseAnnotationV0 } from "../manifest/types.v0";
import { BaseAnnotation } from "./base.annotation";
import { IMapperUserData } from "../user-data";

const NormalY = new Vector3(0, 1, 0);
const degreesPerRadian = 180 / Math.PI;

function vectorAngleAroundY(from: Vector3, to: Vector3) {
  const angle = from.angleTo(to);

  if (from.clone().cross(to).y >= 0) {
    return -angle;
  }
  return angle;
}

/**
 * A box describing a cross-section cut from the larger model.
 * Detached from any particular model, only associated to the origin.
 *
 * The anchorPoint is the center of the plane, and the back of the box.
 */
export class CrossSectionAnnotation extends BaseAnnotation {
  override type = AnnotationType.crossSection;
  override readonly mustBeAttachedToMesh = false;
  override get identifier() {
    return this.#identifier;
  }
  override get anchorPoint() {
    return this.#group.position;
  }
  get dimensions() {
    return this.#dimensions;
  }
  get angleToNorthAroundY() {
    return this.#radiansToNorthAroundY * degreesPerRadian;
  }

  #identifier: string;
  #radiansToNorthAroundY: number;
  #dimensions: Vector3;
  readonly #boxMesh: Mesh<BoxGeometry>;
  readonly #group: Group;

  constructor(
    identifier: string,
    dimensions: Vector3,
    centerPoint: Vector3,
    angleToNorthAroundY: number,
  ) {
    super();

    this.#identifier = identifier;
    this.#radiansToNorthAroundY = angleToNorthAroundY;
    this.#dimensions = dimensions;

    const geometry = new BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
    this.#boxMesh = new Mesh(geometry, new MeshBasicMaterial({
      color: 0xFFFFFF,
      opacity: 0.5,
      transparent: true,
    }));

    this.#group = new Group();
    (this.#group as IMapperUserData).isAnnotationGroup = true;
    this.#group.add(this.#boxMesh);
    this.#boxMesh.position.set(0, 0, -dimensions.z / 2);

    this.#group.rotateY(-this.#radiansToNorthAroundY);
    this.#group.position.copy(centerPoint);
  }

  static fromCrosslineAndBoundingBox(
    identifier: string,
    origin: Vector3,
    dest: Vector3,
    depth: number,
    boundingBoxOfModels: Box3
  ) {
    const { min: { y: minY }, max: { y: maxY } } = boundingBoxOfModels;

    const originAtMin = origin.clone().setY(minY);
    const destAtMin = dest.clone().setY(minY);

    const height = maxY - minY;
    const width = originAtMin.distanceTo(destAtMin);
    const dimensions = new Vector3(width, height, depth);

    const vectorFromOriginToDest =
      destAtMin
        .clone()
        .sub(originAtMin);

    const angleToNorthOfBoxNormal =
      vectorAngleAroundY(new Vector3(1, 0, 0), vectorFromOriginToDest);

    const centerPoint = originAtMin
      .clone()
      .add(vectorFromOriginToDest.clone().divideScalar(2))
      .add(new Vector3(0, height / 2, 0));

    // const normalVector = vectorFromOriginToDest
    //   .clone()
    //   .normalize()
    //   .applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 2); // rotate vector to be the normal of the original vector

    return new CrossSectionAnnotation(
      identifier,
      dimensions,
      centerPoint,
      angleToNorthOfBoxNormal,
    );
  }

  changeDimensions(newDimensions: Vector3) {
    const difference = newDimensions.clone().sub(this.#dimensions);
    if (difference.length() === 0) {
      return;
    }

    this.#boxMesh.position.setZ(newDimensions.z / 2);
    this.#boxMesh.geometry = new BoxGeometry(newDimensions.x, newDimensions.y, newDimensions.z);
  }

  changeCenterPoint(pos: Vector3) {
    this.#group.position.copy(pos);
  }

  override rename(newIdentifier: string): void {
    this.#identifier = newIdentifier;
  }
  override serializeToManifest(version: number): IMetadataBaseAnnotationV0 | null {
    throw new Error("Method not implemented.");
  }
  override addToGroup(group: Group<Object3DEventMap>): void {
    group.add(this.#group);
  }
  override removeFromGroup(group: Group<Object3DEventMap>): void {
    group.remove(this.#group);
  }
  override toggleVisibility(show: boolean): void {
    this.#group.visible = show;
  }

}
