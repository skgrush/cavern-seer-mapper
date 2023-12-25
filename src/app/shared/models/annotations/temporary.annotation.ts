import { Group, Object3D, Vector3 } from "three";
import { BaseAnnotation } from "./base.annotation";
import { AnnotationType } from "../annotation-type.enum";
import { IMetadataBaseAnnotationV0 } from "../manifest/types.v0";
import { IMapperUserData } from "../user-data";

/**
 * Annotation that should not be serialized and is just temporarily attached.
 */
export class TemporaryAnnotation<T extends Object3D> extends BaseAnnotation {
  override readonly type = AnnotationType.temporary;
  override readonly mustBeAttachedToMesh = false;
  override identifier: string;

  override get anchorPoint() {
    return this.#getAnchor(this.object);
  }

  readonly object: T;
  readonly #getAnchor: (t: T) => Vector3;

  constructor(
    identifier: string,
    object: T,
    getAnchor: (o: T) => Vector3,
  ) {
    super();
    this.identifier = identifier;
    this.object = object;
    this.#getAnchor = getAnchor;

    const userData = (this.object.userData as IMapperUserData);
    userData.isTemporaryAnnotation = true;
  }

  override rename(newIdentifier: string): void {
    this.identifier = newIdentifier;
  }
  override serializeToManifest(version: number): IMetadataBaseAnnotationV0 | null {
    throw new Error('Temporary annotations should not be serialized');
  }
  override addToGroup(group: Group): void {
    group.add(this.object);
  }
  override removeFromGroup(group: Group): void {
    group.remove(this.object);
  }
  override toggleVisibility(show: boolean): void {
    this.object.visible = show;
  }
}
