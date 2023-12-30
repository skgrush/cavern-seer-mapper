import { BoxHelper, Group, Mesh } from "three";
import { BaseVisibleRenderModel } from "./base.render-model";
import { FileModelType } from "../model-type.enum";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { Subject } from "rxjs";
import { ISimpleVector3 } from "../simple-types";
import { UploadFileModel } from "../upload-file-model";
import { BaseAnnotation } from "../annotations/base.annotation";
import { IMapperUserData } from "../user-data";
import { ModelChangeType } from "../model-change-type.enum";

export class ObjRenderModel extends BaseVisibleRenderModel<FileModelType.obj> {
  override readonly type = FileModelType.obj;
  readonly #childOrPropertyChanged = new Subject<ModelChangeType>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override readonly identifier: string;
  override comment: string | null;
  override readonly rendered = true;
  override get position() {
    return this.#object.position;
  }

  readonly #object: Group;
  readonly #boxHelper: BoxHelper;
  readonly #blob: Blob;
  readonly #annotations = new Set<BaseAnnotation>();

  constructor(
    identifier: string,
    object: Group,
    blob: Blob,
    comment: string | null,
  ) {
    super();
    this.#object = object;
    this.#blob = blob;
    this.#boxHelper = new BoxHelper(object);

    this.identifier = identifier;
    this.comment = comment;

    (this.#object.userData as IMapperUserData).fromSerializedModel = true;
    object.traverse(child => {
      (child.userData as IMapperUserData).fromSerializedModel = true;
    })
  }

  static fromUploadModel(uploadModel: UploadFileModel, object: Group) {
    const { identifier, blob, comment } = uploadModel;
    object.name = uploadModel.identifier;
    return new ObjRenderModel(
      identifier,
      object,
      blob,
      comment,
    );
  }

  override serialize() {
    return this.#blob;
  }

  override setComment(comment: string | null): boolean {
    this.comment = comment;
    return true;
  }

  override setPosition({ x, y, z }: ISimpleVector3): boolean {
    this.#object.position.set(x, y, z);
    this.#childOrPropertyChanged.next(ModelChangeType.PositionChanged);
    return true;
  }

  override setMaterial(material: BaseMaterialService<any>): void {
    this.#object.traverse(child => {
      if (child instanceof Mesh && (child.userData as IMapperUserData).fromSerializedModel) {
        child.material = material.material;
      }
    });
  }

  override addToGroup(group: Group): void {
    if (this.#object.parent !== null) {
      throw new Error('attempt to add ObjRenderModel to group while model already has a parent');
    }
    group.add(this.#object);
  }
  override removeFromGroup(group: Group): void {
    group.remove(this.#object);
  }

  override dispose(): void {
    this.#boxHelper.dispose();
  }

  override getAnnotations(): readonly BaseAnnotation[] {
    return [...this.#annotations];
  }

  override addAnnotation(anno: BaseAnnotation, toGroup?: Group): boolean {
    if (toGroup && this.#object !== toGroup) {
      return false;
    }

    anno.addToGroup(this.#object);
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

      anno.removeFromGroup(this.#object);
      this.#childOrPropertyChanged.next(ModelChangeType.EntityRemoved);

      annosToDelete.delete(anno);
    }
  }
}
