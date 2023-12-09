import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GroupRenderModel } from '../models/render/group.render-model';
import { BaseRenderModel } from '../models/render/base.render-model';



@Injectable()
export class ModelManagerService {

  readonly #currentOpenGroup = new BehaviorSubject<GroupRenderModel | undefined>(undefined);

  readonly currentOpenGroup$ = this.#currentOpenGroup.asObservable();

  resetCurrentGroup(group?: GroupRenderModel) {
    // don't dispose of the current, let the canvas do that
    this.#currentOpenGroup.next(group);
  }

  resetToNonGroupModel(model?: BaseRenderModel<any>) {
    if (model instanceof GroupRenderModel || !model) {
      this.resetCurrentGroup(model);
      return;
    }

    const group = GroupRenderModel.fromModels('from resetToNonGroupModel()', [model]);
    this.resetCurrentGroup(group);
  }

  importModels(models: BaseRenderModel<any>[]) {
    let currentOpenGroup = this.#currentOpenGroup.value;
    if (!currentOpenGroup) {
      currentOpenGroup = new GroupRenderModel('from importModels()');
      this.#currentOpenGroup.next(currentOpenGroup);
    }

    for (const model of models) {
      currentOpenGroup.addModel(model);
    }
  }
}
