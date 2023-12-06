import { BoxHelper, Group, Object3DEventMap, Scene } from "three";
import { BaseRenderModel, ISimpleVector3 } from "./base.render-model";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { FileModelType } from "../model-type.enum";
import { Subject, Subscription } from "rxjs";


export class GroupRenderModel extends BaseRenderModel<FileModelType.group> {
  override readonly type = FileModelType.group;
  readonly #childOrPropertyChanged = new Subject<void>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override readonly identifier: string;
  override get position() {
    return this.#group.position;
  }

  readonly #group = new Group();
  readonly #models = new Set<BaseRenderModel<any>>();
  readonly #modelsSubscriptions = new WeakMap<BaseRenderModel<any>, Subscription>();

  get children(): Array<BaseRenderModel<any>> {
    return [...this.#models];
  }

  constructor() {
    super();
    this.identifier = Math.random().toString();
  }

  /**
   * Add the model to this group.
   * Emits {@link childOrPropertyChanged$} before returning.
   */
  addModel(model: BaseRenderModel<any>): boolean {
    if (this.#models.has(model)) {
      return false;
    }

    model.addToGroup(this.#group);
    this.#models.add(model);

    this.#modelsSubscriptions.set(
      model,
      model.childOrPropertyChanged$.subscribe(() => this.#childOrPropertyChanged.next()),
    );
    this.#childOrPropertyChanged.next();

    return true;
  }

  /**
   * Remove the model from the group.
   * Emits {@link childOrPropertyChanged$} before returning.
   */
  removeModel(model: BaseRenderModel<any>) {
    if (!this.#models.has(model)) {
      return false;
    }

    model.removeFromGroup(this.#group);
    this.#models.delete(model);

    const subscription = this.#modelsSubscriptions.get(model);
    if (subscription) {
      subscription.unsubscribe();
      this.#modelsSubscriptions.delete(model);
    }

    return true;
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

  dispose() {
    for (const model of this.#models) {
      model.dispose();
    }
  }

  override setPosition(pos: ISimpleVector3): boolean {
    this.#group.position.set(pos.x, pos.y, pos.z);
    this.#childOrPropertyChanged.next();
    return true;
  }
  override setMaterial(material: BaseMaterialService<any>): void {
    for (const model of this.#models) {
      model.setMaterial(material);
    }
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
}
