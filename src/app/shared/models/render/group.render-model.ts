import { BoxHelper, Group, Object3DEventMap, Scene } from "three";
import { BaseRenderModel } from "./base.render-model";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { FileModelType } from "../model-type.enum";


export class GroupRenderModel extends BaseRenderModel<FileModelType.group> {
  override readonly type = FileModelType.group;

  readonly #group = new Group();
  readonly models = new Set<BaseRenderModel<any>>();

  addModel(model: BaseRenderModel<any>): boolean {
    if (this.models.has(model)) {
      return false;
    }
    model.addToGroup(this.#group);
    this.models.add(model);

    return true;
  }
  removeModel(model: BaseRenderModel<any>) {
    if (!this.models.has(model)) {
      return false;
    }

    model.removeFromGroup(this.#group);
    this.models.delete(model);
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
    for (const model of this.models) {
      model.dispose();
    }
  }

  override setMaterial(material: BaseMaterialService<any>): void {
    for (const model of this.models) {
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
