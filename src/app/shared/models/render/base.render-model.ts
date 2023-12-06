import { Group, Vector3 } from "three";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { FileModelType } from "../model-type.enum";
import { Observable } from "rxjs";

export type ISimpleVector3 = {
  readonly x: number,
  readonly y: number,
  readonly z: number,
}

export abstract class BaseRenderModel<T extends FileModelType> {

  abstract readonly type: T;
  abstract readonly childOrPropertyChanged$: Observable<void>;
  abstract readonly identifier: string;
  abstract readonly position: Readonly<Vector3>;

  abstract setPosition(pos: ISimpleVector3): boolean;

  abstract setMaterial(material: BaseMaterialService<any>): void;

  abstract addToGroup(group: Group): void;
  abstract removeFromGroup(group: Group): void;

  abstract dispose(): void;
}
