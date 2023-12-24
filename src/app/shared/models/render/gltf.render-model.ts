import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { BaseVisibleRenderModel } from "./base.render-model";
import { FileModelType } from "../model-type.enum";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { Group, Object3DEventMap, Vector3 } from "three";
import { Subject } from "rxjs";
import { ISimpleVector3 } from "../simple-types";
import { UploadFileModel } from "../upload-file-model";
import { BaseAnnotation } from "../annotations/base.annotation";
import { ModelChangeType } from "../model-change-type.enum";

/**
 * TODO: basically unimplemented so far...
 */
export class GltfRenderModel extends BaseVisibleRenderModel<FileModelType.gLTF> {
  override readonly type = FileModelType.gLTF;
  readonly #childOrPropertyChanged = new Subject<ModelChangeType>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override readonly identifier: string;
  override comment: string | null;
  override readonly rendered = true;
  override get position(): Readonly<Vector3> {
    throw new Error('position not implemented in GltfModel');
  }

  readonly #blob: Blob;
  readonly #object: GLTF;

  constructor(
    identifier: string,
    blob: Blob,
    object: GLTF,
    comment: string | null,
  ) {
    super();
    this.identifier = identifier;
    this.#blob = blob;
    this.#object = object;
    this.comment = comment;
  }

  static fromUploadModel(uploadModel: UploadFileModel, object: GLTF) {
    const { identifier, blob, comment } = uploadModel;
    return new GltfRenderModel(
      identifier,
      blob,
      object,
      comment,
    );
  }

  override serialize() {
    return this.#blob;
  }

  override setComment(comment: string | null) {
    this.comment = comment;
    return true;
  }

  override setPosition(pos: ISimpleVector3): boolean {
    throw new Error("Method not implemented in GltfModel.");
  }
  override setMaterial(material: BaseMaterialService<any>): void {
    throw new Error("Method not implemented in GltfModel.");
  }
  override addToGroup(group: Group<Object3DEventMap>): void {
    throw new Error("Method not implemented.");
  }
  override removeFromGroup(group: Group<Object3DEventMap>): void {
    throw new Error("Method not implemented.");
  }
  override dispose(): void {
    throw new Error("Method not implemented.");
  }
  override getAnnotations(): readonly BaseAnnotation[] {
    throw new Error("Method not implemented");
  }
  override addAnnotation(anno: BaseAnnotation, toGroup?: Group): boolean {
    throw new Error("Method not implemented");
  }
  override removeAnnotations(annosToDelete: Set<BaseAnnotation>): void {
    throw new Error("Method not implemented");
  }
}
