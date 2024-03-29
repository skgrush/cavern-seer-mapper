import { Subject, Subscription } from 'rxjs';
import { BoxHelper, Group, Object3D, Object3DEventMap, Scene } from 'three';
import { markSceneOfItemForReRender } from '../../functions/mark-scene-of-item-for-rerender';
import { BaseMaterialService } from '../../services/materials/base-material.service';
import { BaseAnnotation } from '../annotations/base.annotation';
import { ModelChangeType } from '../model-change-type.enum';
import { FileModelType } from '../model-type.enum';
import { ISimpleVector3 } from '../simple-types';
import { BaseRenderModel, BaseVisibleRenderModel } from './base.render-model';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { IUnzipDirEntry } from '../../services/zip.service';


export class GroupRenderModel extends BaseVisibleRenderModel<FileModelType.group> {
  override readonly type = FileModelType.group;
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
  protected override readonly _hasCustomTexture = false;

  readonly #group = new Group();
  readonly #annotations = new Set<BaseAnnotation>();
  readonly #models: BaseRenderModel<any>[] = [];
  readonly #modelsSubscriptions = new WeakMap<BaseRenderModel<any>, Subscription>();

  #currentMaterial?: BaseMaterialService<any>;

  get children(): Array<BaseRenderModel<any>> {
    return [...this.#models];
  }

  constructor(
    identifier: string,
    comment: string | null,
  ) {
    super();
    this.identifier = identifier;
    this.#group.name = identifier;

    this.comment = comment;
  }

  public static fromModels(identifier: string, models: BaseRenderModel<any>[]) {
    const group = new GroupRenderModel(identifier, null);

    for (const model of models) {
      group.addModel(model);
    }
    return group;
  }

  public static fromUnzipDirEntry(entry: IUnzipDirEntry, models: BaseRenderModel<any>[]) {
    const group = new GroupRenderModel(entry.name, entry.comment);

    for (const model of models) {
      group.addModel(model);
    }
    return group;
  }

  /**
   * Add the model to this group.
   * Emits {@link childOrPropertyChanged$} before returning.
   */
  addModel(model: BaseRenderModel<any>): boolean {
    if (this.#models.includes(model)) {
      return false;
    }

    model.addToGroup(this.#group);
    this.#models.push(model);

    if (model instanceof BaseVisibleRenderModel) {
      if (this.#currentMaterial) {
        model.setMaterial(this.#currentMaterial);
      }
    }

    this.#modelsSubscriptions.set(
      model,
      model.childOrPropertyChanged$.subscribe(e => this.#childOrPropertyChanged.next(e)),
    );
    this.#childOrPropertyChanged.next(ModelChangeType.EntityAdded);

    return true;
  }

  /**
   * Remove the model from the group.
   * Emits {@link childOrPropertyChanged$} before returning.
   */
  removeModel(model: BaseRenderModel<any>) {
    const currentIdx = this.#models.indexOf(model);
    if (currentIdx === -1) {
      return false;
    }

    model.removeFromGroup(this.#group);
    this.#models.slice(currentIdx);

    const subscription = this.#modelsSubscriptions.get(model);
    if (subscription) {
      subscription.unsubscribe();
      this.#modelsSubscriptions.delete(model);
    }

    this.#childOrPropertyChanged.next(ModelChangeType.EntityRemoved);

    return true;
  }

  reorderModels(currentIndex: number, previousIndex: number) {
    if (currentIndex >= this.#models.length || previousIndex >= this.#models.length) {
      console.warn('currentIndex or previousIndex out of bounds of models list');
      return;
    }

    moveItemInArray(this.#models, previousIndex, currentIndex);
    this.#childOrPropertyChanged.next(ModelChangeType.MetadataChanged);
  }

  addToScene(scene: Scene) {
    scene.add(this.#group);
  }
  removeFromScene(scene: Scene) {
    scene.remove(this.#group);
  }

  getBoundingBox() {
    const boxHelper = new BoxHelper(this.#group);
    boxHelper.geometry.computeBoundingBox();
    const box = boxHelper.geometry.boundingBox!;
    boxHelper.dispose();
    return box;
  }

  encode<T>(fn: (o: Object3D) => T) {
    return fn(this.#group);
  }

  dispose() {
    for (const model of this.#models) {
      model.dispose();
    }
  }

  override serialize() {
    return null;
  }

  override rename(name: string): boolean {
    this.identifier = name;
    this.#group.name = name;
    this.#childOrPropertyChanged.next(ModelChangeType.MetadataChanged);
    return true;
  }

  override setComment(comment:string | null): boolean {
    this.comment = comment;
    return true;
  }

  override setPosition({ x, y, z }: ISimpleVector3): boolean {
    this.#group.position.set(x, y, z);
    this.#childOrPropertyChanged.next(ModelChangeType.PositionChanged);
    return true;
  }

  /**
   * Overrides base setMaterial; recursively calls setMaterial on visible models.
   */
  override setMaterial(material: BaseMaterialService<any>): void {
    this.#currentMaterial = material;
    for (const model of this.#models) {
      if (model instanceof BaseVisibleRenderModel) {
        model.setMaterial(material);
      }
    }
  }

  override setVisibility(visible: boolean) {
    this.#group.visible = visible;
    markSceneOfItemForReRender(this.#group);
  }

  override addToGroup(group: Group<Object3DEventMap>): void {
    if (this.#group.parent !== null) {
      throw new Error('attempted to add GroupRenderModel to group while model already has parent');
    }
    group.add(this.#group);
  }
  override removeFromGroup(group: Group<Object3DEventMap>): void {
    group.remove(this.#group);
  }

  override getAnnotations(): BaseAnnotation[] {
    return [...this.#annotations];
  }

  getAllAnnotationsRecursively(): readonly BaseAnnotation[] {
    const childAnnos = this.children.flatMap(child => {
      if (child instanceof GroupRenderModel) {
        return child.getAllAnnotationsRecursively();
      }
      if (child instanceof BaseVisibleRenderModel) {
        return child.getAnnotations();
      }
      return [];
    });

    childAnnos.push(...this.getAnnotations());

    return childAnnos;
  }

  override addAnnotation(anno: BaseAnnotation, toGroup?: Group): boolean {
    if (toGroup === undefined || this.#group === toGroup) {
      if (!anno.mustBeAttachedToMesh) {
        this.#annotations.add(anno);
        anno.addToGroup(this.#group);
        this.#childOrPropertyChanged.next(ModelChangeType.EntityAdded);
        return true;
      }

      throw new Error('attempt to add annotation to non mesh group??');
    }
    for (const child of this.children) {
      if (child instanceof BaseVisibleRenderModel) {
        const success = child.addAnnotation(anno, toGroup);
        if (success) {
          return true;
        }
      }
    }
    return false;
  }

  override removeAnnotations(annosToDelete: Set<BaseAnnotation>): void {
    markSceneOfItemForReRender(this.#group);

    for (const anno of annosToDelete) {
      if (this.#annotations.has(anno)) {
        anno.removeFromGroup(this.#group);
        this.#annotations.delete(anno);
        annosToDelete.delete(anno);
      }
    }

    for (const child of this.children) {
      if (child instanceof BaseVisibleRenderModel) {
        child.removeAnnotations(annosToDelete);
        if (annosToDelete.size === 0) {
          return;
        }
      }
    }
  }
}
