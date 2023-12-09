import { BehaviorSubject, NEVER, Observable, ReplaySubject } from "rxjs";
import { Vector3, Group, Object3DEventMap } from "three";
import { BaseMaterialService } from "../services/3d-managers/base-material.service";
import { FileModelType } from "./model-type.enum";
import { BaseRenderModel } from "./render/base.render-model";
import { ISimpleVector3 } from "./simple-types";
import { UploadFileModel } from "./upload-file-model";



export class ManifestRenderModel extends BaseRenderModel<FileModelType.manifest> {
  override readonly type = FileModelType.manifest;
  override readonly childOrPropertyChanged$ = NEVER;
  override readonly identifier = this.uploadModel.identifier;
  override readonly position: Readonly<Vector3> = new Vector3();
  override readonly rendered = false;

  constructor(
    readonly uploadModel: UploadFileModel,
  ) {
    super();
  }

  override serialize(): never {
    throw new Error('Call to ManifestRenderModel#serialize()');
  }

  override setPosition(pos: ISimpleVector3): boolean {
    return false;
  }
  override setMaterial(material: BaseMaterialService<any>): void {
  }
  override addToGroup(group: Group<Object3DEventMap>): void {
  }
  override removeFromGroup(group: Group<Object3DEventMap>): void {
  }
  override dispose(): void {
  }

}
