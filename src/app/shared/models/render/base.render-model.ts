import { Group } from "three";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { FileModelType } from "../model-type.enum";
import { Observable } from "rxjs";

export abstract class BaseRenderModel<T extends FileModelType> {

  abstract readonly type: T;
  abstract readonly childOrPropertyChanged$: Observable<void>;
  abstract readonly identifier: string;

  abstract setMaterial(material: BaseMaterialService<any>): void;

  abstract addToGroup(group: Group): void;
  abstract removeFromGroup(group: Group): void;

  abstract dispose(): void;
}
