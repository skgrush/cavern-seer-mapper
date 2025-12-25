import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BaseVisibleRenderModel } from "./base.render-model";
import { FileModelType } from "../model-type.enum";
import { BoxHelper, Camera, Group, Object3DEventMap, Vector3 } from "three";
import { Subject } from "rxjs";
import { ISimpleVector3 } from "../simple-types";
import { UploadFileModel } from "../upload-file-model";
import { BaseAnnotation } from "../annotations/base.annotation";
import { ModelChangeType } from "../model-change-type.enum";
import { IMapperUserData } from "../user-data";
import {markSceneOfItemForReRender} from "../../functions/mark-scene-of-item-for-rerender";

export class GltfRenderModel extends BaseVisibleRenderModel<FileModelType.gLTF> {
  override readonly type = FileModelType.gLTF;
  readonly #childOrPropertyChanged = new Subject<ModelChangeType>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override identifier: string;
  override comment: string | null;
  override readonly rendered = true;

  override get position(): Readonly<Vector3> {
    return this.#gltf.scene.position;
  }
  override get visible() {
    return this.#gltf.scene.visible;
  }

  protected override get _group() {
    return this.#gltf.scene;
  }
  protected override readonly _hasCustomTexture: boolean;

  readonly #blob: Blob;
  readonly #gltf: GLTF;

  readonly #boxHelper: BoxHelper;
  readonly #annotations = new Set<BaseAnnotation>();

  constructor(
    identifier: string,
    blob: Blob,
    gltf: GLTF,
    comment: string | null,
  ) {
    super();
    this.identifier = identifier;
    this.#blob = blob;
    this.#gltf = gltf;
    this.comment = comment;
    this._hasCustomTexture = false;

    const object = gltf.scene;
    this.#boxHelper = new BoxHelper(object);
    (object.userData as IMapperUserData).fromSerializedModel = true;
    object.traverse(child => {
      if (child instanceof Camera) {
        console.warn('Found camera in GLTF', identifier, '; unsupported behavior.');
      }

      (child.userData as IMapperUserData).fromSerializedModel = true;
    })
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

  override rename(name: string): boolean {
    this.identifier = name;
    this.#childOrPropertyChanged.next(ModelChangeType.MetadataChanged);
    return true;
  }

  override setComment(comment: string | null) {
    this.comment = comment;
    this.#childOrPropertyChanged.next(ModelChangeType.MetadataChanged);
    return true;
  }

  override setPosition({ x, y, z }: ISimpleVector3): boolean {
    this.#gltf.scene.position.set(x, y, z);
    this.#childOrPropertyChanged.next(ModelChangeType.PositionChanged);
    return true;
  }

  override setVisibility(visible: boolean) {
    this.#gltf.scene.visible = visible;
    markSceneOfItemForReRender(this.#gltf.scene, ngDevMode && 'gltf model set visibility');
  }

  override addToGroup(group: Group<Object3DEventMap>): void {
    if (this.#gltf.scene.parent !== null) {
      throw new Error('attempt to add GltfRenderModel to group while model already has a parent');
    }
    group.add(this.#gltf.scene);
  }

  override removeFromGroup(group: Group<Object3DEventMap>): void {
    group.remove(this.#gltf.scene);
  }

  override dispose(): void {
    this.#boxHelper.dispose();
  }

  override getAnnotations(): readonly BaseAnnotation[] {
    return [...this.#annotations];
  }

  override addAnnotation(anno: BaseAnnotation, toGroup?: Group): boolean {
    if (toGroup && this.#gltf.scene !== toGroup) {
      return false;
    }

    anno.addToGroup(this.#gltf.scene);
    this.#annotations.add(anno);
    this.#childOrPropertyChanged.next(ModelChangeType.EntityAdded);
    return true;
  }

  override removeAnnotations(annosToDelete: Set<BaseAnnotation>): void {
    for (const anno of annosToDelete) {
      const deleted = this.#annotations.delete(anno);
      if (!deleted) {
        continue;
      }

      anno.removeFromGroup(this.#gltf.scene);
      this.#childOrPropertyChanged.next(ModelChangeType.EntityRemoved);

      annosToDelete.delete(anno);
    }
  }
}
