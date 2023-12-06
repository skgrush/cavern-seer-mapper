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

    const group = new GroupRenderModel();
    group.addModel(model);
    this.resetCurrentGroup(group);
  }
}
