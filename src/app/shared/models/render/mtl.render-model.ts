import { BaseRenderModel } from './base.render-model';
import { FileModelType } from '../model-type.enum';
import { Subject } from 'rxjs';
import { ModelChangeType } from '../model-change-type.enum';
import { Group, Object3DEventMap, Vector3 } from 'three';
import { UploadFileModel } from '../upload-file-model';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

export class MtlRenderModel extends BaseRenderModel<FileModelType.mtl> {
  override readonly type = FileModelType.mtl;
  readonly #childOrPropertyChanged = new Subject<ModelChangeType>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override readonly position: Readonly<Vector3> = new Vector3();
  override identifier: string;
  override comment: string | null;
  override readonly rendered = false;

  readonly #blob: Blob;
  readonly materialCreator: MTLLoader.MaterialCreator;

  constructor(
    identifier: string,
    comment: string | null,
    blob: Blob,
    loader: MTLLoader.MaterialCreator,
  ) {
    super();
    this.identifier = identifier;
    this.comment = comment;
    this.#blob = blob;
    this.materialCreator = loader;
  }

  static fromUploadModel(uploadModel: UploadFileModel, loader: MTLLoader.MaterialCreator) {
    const { identifier, blob, comment } = uploadModel;
    return new MtlRenderModel(identifier, comment, blob, loader);
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
