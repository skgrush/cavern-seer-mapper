import { Subject, defer, tap } from "rxjs";
import {
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3DEventMap,
  OrthographicCamera,
  Vector3,
} from 'three';
import { markSceneOfItemForReRender } from "../../functions/mark-scene-of-item-for-rerender";
import { LocalizeService } from "../../services/localize.service";
import { AnnotationType } from "../annotation-type.enum";
import { IMetadataCrossSectionV0 } from "../manifest/types.v0";
import { simpleVector3FromVector3 } from "../simple-types";
import { IMapperUserData } from "../user-data";
import { BaseAnnotation } from "./base.annotation";

export const degreesPerRadian = 180 / Math.PI;

export function vectorAngleAroundY(from: Vector3, to: Vector3) {
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

  readonly #localize: LocalizeService;

  #camera?: OrthographicCamera;
  #measureLines?: readonly [
    white: Line,
    black: Line,
  ];

  constructor(
    identifier: string,
    dimensions: Vector3,
    centerPoint: Vector3,
    radiansToNorthAroundY: number,
    localize: LocalizeService,
  ) {
    super();

    this.#localize = localize;

    this.#identifier = identifier;
    this.#radiansToNorthAroundY = radiansToNorthAroundY;
    this.#dimensions = dimensions;

    const geometry = new BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
    this.#boxMesh = new Mesh(geometry, new MeshBasicMaterial({
      color: 0xFFFFFF,
      opacity: 0.5,
      transparent: true,
      side: DoubleSide,
    }));
    this.#boxMesh.frustumCulled = false;

    this.#group = new Group();
    (this.#group as IMapperUserData).isAnnotationGroup = true;
    this.#group.add(this.#boxMesh);
    this.#boxMesh.position.set(0, 0, -dimensions.z / 2);

    this.#group.rotateY(-this.#radiansToNorthAroundY);
    this.#group.position.copy(centerPoint);
  }

  #addCamera() {
    if (this.#camera) {
      throw new Error('already have a camera');
    }
    this.#camera = new OrthographicCamera();
    this.#group.add(this.#camera);
    this.#updateCamera();

    return this.#camera;
  }

  #removeCamera() {
    if (!this.#camera) {
      return;
    }
    this.#camera.removeFromParent();
    this.#camera = undefined;
  }

  #updateCamera() {
    const cam = this.#camera;
    if (!cam) {
      return;
    }
    const dims = this.dimensions;

    cam.left = dims.x / -2;
    cam.right = dims.x / 2;
    cam.top = dims.y / 2;
    cam.bottom = dims.y / -2;
    cam.near = 0;
    cam.far = dims.z;
    cam.updateProjectionMatrix();
    markSceneOfItemForReRender(cam, ngDevMode && 'cross section cam update');
  }

  #drawLine() {
    if (this.#measureLines) {
      throw new Error('already have lines');
    }
    this.#measureLines = [
      new LineSegments(
        new BufferGeometry(),
        new LineBasicMaterial({ color: 0xFFFFFF }),
      ),
      new LineSegments(
        new BufferGeometry(),
        new LineBasicMaterial({ color: 0x000000 }),
      ),
    ];

    this.#updateLine();
  }

  #updateLine() {
    if (!this.#measureLines) {
      return;
    }

    for (let offset = 0; offset < this.#measureLines.length; ++offset) {
      const line = this.#measureLines[offset];
      line.geometry.setFromPoints([
        ...this.#getMeasureLinePoints(offset),
      ]);
      line.computeLineDistances();
      line.position.set(0, -this.dimensions.y / 2 + 0.5, -0.5);
    }
  }

  changeDimensions(newDimensions: Vector3) {
    const difference = newDimensions.clone().sub(this.#dimensions);
    if (difference.length() === 0) {
      return;
    }

    this.#boxMesh.position.setZ(-newDimensions.z / 2);
    this.#boxMesh.geometry = new BoxGeometry(newDimensions.x, newDimensions.y, newDimensions.z);
    markSceneOfItemForReRender(this.#boxMesh, ngDevMode && 'cross section changed dimensions');
    this.#dimensions = newDimensions.clone();
    this.#updateCamera();
    this.#updateLine();
  }

  changeRotation(angleDegrees: number) {
    this.#radiansToNorthAroundY = angleDegrees / degreesPerRadian;

    this.#group.setRotationFromAxisAngle(new Vector3(0, 1, 0), -this.#radiansToNorthAroundY);
    markSceneOfItemForReRender(this.#group, ngDevMode && 'cross section changed rotation');

    this.#updateCamera();
    this.#updateLine();
  }

  changeCenterPoint(pos: Vector3) {
    this.#group.position.copy(pos);
    markSceneOfItemForReRender(this.#group, ngDevMode && 'cross section changed centerPoint');
  }

  override rename(newIdentifier: string): void {
    this.#identifier = newIdentifier;
  }
  override serializeToManifest(version: number): IMetadataCrossSectionV0 {
    if (version !== 0) {
      throw new RangeError(`CrossSectionAnnotation only supports manifest v0, got ${version}`);
    }

    return {
      type: AnnotationType.crossSection,
      identifier: this.identifier,
      centerPoint: simpleVector3FromVector3(this.anchorPoint),
      dimensions: simpleVector3FromVector3(this.dimensions),
      angleToNorthAroundY: this.angleToNorthAroundY,
    }
  }
  override addToGroup(group: Group<Object3DEventMap>): void {
    group.add(this.#group);
  }
  override removeFromGroup(group: Group<Object3DEventMap>): void {
    group.remove(this.#group);
  }
  override toggleVisibility(show: boolean): void {
    this.#group.visible = show;
    markSceneOfItemForReRender(this.#group, ngDevMode && 'cross section toggleVisibility');
  }

  /**
   * Create a camera and an observable; the camera and render behaviors
   * will be cleaned up when unsubscribing from the observable.
   */
  startRenderMode() {
    this.#addCamera();

    return {
      camera: this.#camera!,
      crossSectionRenderMode$: defer(() => {
        if (!this.#camera) {
          throw new Error('Subscribed to crossSectionRenderMode$ after camera cleaned up');
        }

        this.#boxMesh.visible = false;

        this.#drawLine();
        this.#group.add(...this.#measureLines!);

        return new Subject<void>();
      }).pipe(
        tap({
          unsubscribe: () => {
            this.#boxMesh.visible = this.#group.visible;
            this.#removeCamera();
            this.#group.remove(...this.#measureLines!);
            this.#measureLines = undefined;
            markSceneOfItemForReRender(this.#group, ngDevMode && 'cross section cleanup');
          },
        })
      ),
    };
  }

  *#getMeasureLinePoints(offset: number) {
    const unit = this.#localize.localLengthToMeters(1);
    const xVector = new Vector3(unit, 0, 0);

    const width = this.dimensions.x;

    const totalCount = this.#localize.metersToLocalLength(width + 2);

    const leftOrigin = new Vector3()
      .sub(xVector.clone().multiplyScalar(totalCount / 2 + 1 + offset));

    const currentPoint = leftOrigin.clone();
    for (let i = 0; i < totalCount; ++i) {
      yield currentPoint.clone();

      currentPoint.add(xVector);
    }
  }
}
