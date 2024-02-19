import { NEVER, Subject } from 'rxjs';
import { Group, Object3DEventMap, Vector3 } from "three";
import { FileModelType } from "../model-type.enum";
import { UploadFileModel } from "../upload-file-model";
import { BaseRenderModel } from "./base.render-model";
import { ModelChangeType } from '../model-change-type.enum';


export class UnknownRenderModel extends BaseRenderModel<FileModelType.unknown> {
  override readonly type = FileModelType.unknown;
  readonly #childOrPropertyChanged = new Subject<ModelChangeType>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override readonly position: Readonly<Vector3> = new Vector3();
  override identifier: string;
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
    return new UnknownRenderModel(identifier, comment, blob);
  }

  override serialize() {
    return this.#blob;
  }

  override rename(name: string): boolean {
    this.identifier = name;
    this.#childOrPropertyChanged.next(ModelChangeType.MetadataChanged);
    return true;
  }

  override setComment(comment: string | null): boolean {
    this.comment = comment;
    return true;
  }

  override addToGroup(group: Group<Object3DEventMap>): void { }
  override removeFromGroup(group: Group<Object3DEventMap>): void { }
  override dispose(): void { }

}
