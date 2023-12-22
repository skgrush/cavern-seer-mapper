import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GroupRenderModel } from '../models/render/group.render-model';
import { BaseRenderModel } from '../models/render/base.render-model';
import { BaseAnnotation } from '../models/annotations/base.annotation';
import { Group } from 'three';

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

    const group = GroupRenderModel.fromModels(
      'from resetToNonGroupModel()',
      [model],
    );
    this.resetCurrentGroup(group);
  }

  /**
   * Import the models into the current group.
   *
   * If there is no open group and models is exactly one group, open it.
   * If there is no open group, create one and add models to it.
   */
  importModels(models: BaseRenderModel<any>[]) {
    let currentOpenGroup = this.#currentOpenGroup.value;
    debugger;
    if (currentOpenGroup) {
      for (const model of models) {
        currentOpenGroup.addModel(model);
      }
      this.resetCurrentGroup(currentOpenGroup);
      return;
    }

    if (models.length === 1 && models[0] instanceof GroupRenderModel) {
      this.resetCurrentGroup(models[0]);
      return;
    }

    const group = GroupRenderModel.fromModels(
      'from resetToNonGroupModel()',
      [...models],
    );
    this.resetCurrentGroup(group);
  }

  removeAnnotations(annos: Set<BaseAnnotation>) {
    const current = this.#currentOpenGroup.value;
    if (!current) {
      throw new Error('addAnnotationToGroup called with no model?');
    }
    current.removeAnnotations(annos);
  }

  addAnnotationToGroup(anno: BaseAnnotation, toGroup: Group) {
    const current = this.#currentOpenGroup.value;
    if (!current) {
      throw new Error('addAnnotationToGroup called with no model?');
    }
    current.addAnnotation(anno, toGroup);
  }
}
