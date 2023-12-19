import { Group, Vector3 } from "three";
import { AnnotationType } from "../annotation-type.enum";
import { IMetadataBaseAnnotationV0 } from "../manifest/types.v0";

export abstract class BaseAnnotation {
  abstract readonly type: AnnotationType;
  abstract readonly identifier: string;
  abstract readonly anchorPoint: Vector3;

  abstract serializeToManifest(version: number): null | IMetadataBaseAnnotationV0;
  abstract addToGroup(group: Group): void;
  abstract removeFromGroup(group: Group): void;
  abstract removeFromGroup(group: Group): void;
  abstract toggleVisibility(show: boolean): void;
}
