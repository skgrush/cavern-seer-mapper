import { BoxHelper, Group, Scene } from "three";
import { BaseModel } from "./base.model";


export class GroupModel {

  readonly group = new Group();
  readonly models = new Set<BaseModel<any>>();

  addModel(model: BaseModel<any>): boolean {
    if (this.models.has(model)) {
      return false;
    }
    model.addToGroup(this.group);
    this.models.add(model);

    return true;
  }
  removeModel(model: BaseModel<any>) {
    if (!this.models.has(model)) {
      return false;
    }

    model.removeFromGroup(this.group);
    this.models.delete(model);
    return true;
  }

  addToScene(scene: Scene) {
    scene.add(this.group);
  }
  removeFromScene(scene: Scene) {
    scene.remove(this.group);
  }

  getBoundingBox() {
    const boxHelper = new BoxHelper(this.group);
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
}
