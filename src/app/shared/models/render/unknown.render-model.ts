import { NEVER } from "rxjs";
import { Vector3, Group, Object3DEventMap } from "three";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { FileModelType } from "../model-type.enum";
import { BaseRenderModel } from "./base.render-model";
import { UploadFileModel } from "../upload-file-model";
import { ISimpleVector3 } from "../simple-types";


export class UnknownRenderModel extends BaseRenderModel<FileModelType.unknown> {
  override readonly type = FileModelType.unknown;
  override readonly childOrPropertyChanged$ = NEVER;
  override readonly position: Readonly<Vector3> = new Vector3();
  override readonly identifier: string;
  override comment: string | null;
  override readonly rendered = false;

  readonly #blob: Blob;

  constructor(
    identifier: string,
    comment: string | null,
    blob: Blob,
  ) {
    super();
    this.identifier = identifier;
    this.comment = comment;
    this.#blob = blob;
  }

  static fromUploadModel(uploadModel: UploadFileModel) {
    const { identifier, blob, comment } = uploadModel;
  }

  override serialize() {
    return this.#blob;
  }

  override setComment(comment: string | null): boolean {
    this.comment = comment;
    return true;
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