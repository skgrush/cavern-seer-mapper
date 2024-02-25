import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { GroupRenderModel } from '../models/render/group.render-model';
import { BaseRenderModel } from '../models/render/base.render-model';
import { BaseAnnotation } from '../models/annotations/base.annotation';
import { Group } from 'three';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable()
export class ModelManagerService {

  readonly #title = inject(Title);

  readonly #currentOpenGroup = new BehaviorSubject<GroupRenderModel | undefined>(undefined);

  readonly currentOpenGroup$ = this.#currentOpenGroup.asObservable();

  constructor() {
    this.currentOpenGroup$.pipe(
      map(cog => cog?.identifier ?? 'No model'),
      takeUntilDestroyed(),
    ).subscribe(title => {
      this.#title.setTitle(title);
    })
  }

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

  /**
   * @throws Error if removal failed
   */
  removeModel(model: BaseRenderModel<any>): void {
    const cog = this.#currentOpenGroup.value;
    if (!cog) {
      throw new Error('Failed to delete: No current open group');
    }
    if (model === cog) {
      this.#currentOpenGroup.next(undefined);
      return;
    }
    if (this.#removeModelRecursive(cog, model)) {
      return;
    }

    throw new Error('Failed to delete: model not found in current open group');
  }

  #removeModelRecursive(group: GroupRenderModel, modelToRemove: BaseRenderModel<any>): boolean {
    if (group.removeModel(modelToRemove)) {
      return true;
    }

    for (const child of group.children) {
      if (child instanceof GroupRenderModel && this.#removeModelRecursive(child, modelToRemove)) {
        return true;
      }
    }

    return false;
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
