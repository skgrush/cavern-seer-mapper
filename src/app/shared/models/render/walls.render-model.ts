import { BaseVisibleRenderModel } from './base.render-model';
import { FileModelType } from '../model-type.enum';
import { Subject } from 'rxjs';
import { ModelChangeType } from '../model-change-type.enum';
import { BufferGeometry, Group, Line, LineBasicMaterial, Object3DEventMap } from 'three';
import { BaseAnnotation } from '../annotations/base.annotation';
import { IMapperUserData } from '../user-data';
import { ISimpleVector3 } from '../simple-types';
import { markSceneOfItemForReRender } from '../../functions/mark-scene-of-item-for-rerender';
import { UploadFileModel } from '../upload-file-model';
import { PrimitiveWallsFile } from '../../functions/primitiveWallsFileParse';

export class WallsRenderModel extends BaseVisibleRenderModel<FileModelType.walls> {
  override readonly type = FileModelType.walls;
  readonly #childOrPropertyChanged = new Subject<ModelChangeType>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override identifier: string;
  override comment: string | null;
  override readonly rendered = true;

  override get position() {
    return this.#group.position;
  }
  override get visible() {
    return this.#group.visible;
  }

  protected override get _group() {
    return this.#group;
  }
  protected override readonly _hasCustomTexture = true;

  readonly #blob: Blob;
  readonly #walls: PrimitiveWallsFile;
  readonly #group: Group;
  readonly #annotations = new Set<BaseAnnotation>();

  constructor(
    identifier: string,
    walls: PrimitiveWallsFile,
    blob: Blob,
    comment: string | null,
  ) {
    super();

    this.identifier = identifier;
    this.comment = comment;
    this.#blob = blob;

    this.#walls = walls;
    this.#group = new Group();
    this.#group.add(...WallsRenderModel.vectorsToLines(walls));
    this.#group.rotateX(-Math.PI / 2);

    (this.#group.userData as IMapperUserData).fromSerializedModel = true;
    // don't traverse all items, don't mark all sub-items as fromSerializedModel
  }

  static fromUploadModelAndParsedScanFile(uploadModel: UploadFileModel, walls: PrimitiveWallsFile) {
    const { identifier, blob, comment } = uploadModel;
    return new WallsRenderModel(
      identifier,
      walls,
      blob,
      comment,
    );
  }

  static vectorsToLines(walls: PrimitiveWallsFile) {
    const mat = new LineBasicMaterial({
      color: walls.material.diffuseColor,
    });

    return walls.lines.map(vectorOfLine => {
      const geo = new BufferGeometry().setFromPoints(
        vectorOfLine,
      );
      return new Line(geo, mat);
    });
  }

  override getAnnotations(): readonly BaseAnnotation[] {
    return [...this.#annotations];
  }
  override addAnnotation(anno: BaseAnnotation, toGroup?: Group<Object3DEventMap> | undefined): boolean {
    if (toGroup && this.#group !== toGroup) {
      return false;
    }

    anno.addToGroup(this.#group);
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

      anno.removeFromGroup(this.#group);
      this.#childOrPropertyChanged.next(ModelChangeType.EntityRemoved);

      annosToDelete.delete(anno);
    }
  }

  override setPosition({ x, y, z }: ISimpleVector3): boolean {
    this.#group.position.set(x, y, z);
    this.#childOrPropertyChanged.next(ModelChangeType.PositionChanged);
    markSceneOfItemForReRender(this.#group);
    return true;
  }
  override setVisibility(visible: boolean): void {
    this.#group.visible = visible;
    markSceneOfItemForReRender(this.#group);
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
  override serialize(): Blob | null {
    return this.#blob;
  }
  override addToGroup(group: Group<Object3DEventMap>): void {
    if (this.#group.parent !== null) {
      throw new Error('attempt to add WallsRenderModel to group while model already has a parent');
    }
    group.add(this.#group);
  }
  override removeFromGroup(group: Group<Object3DEventMap>): void {
    group.remove(this.#group);
  }
  override dispose(): void {
    // dispose
  }
}
