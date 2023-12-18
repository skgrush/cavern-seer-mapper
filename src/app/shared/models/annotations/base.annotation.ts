import { Group, Vector3 } from "three";

export abstract class BaseAnnotation {
  abstract readonly identifier: string;
  abstract readonly anchorPoint: Vector3;

  abstract addToGroup(group: Group): void;
  abstract removeFromGroup(group: Group): void;
}
