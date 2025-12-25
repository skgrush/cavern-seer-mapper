import { computed, inject, Injectable, signal, untracked } from '@angular/core';
import { BaseMaterialService, MATERIAL_SERVICES } from './base-material.service';
import { Observable } from 'rxjs';
import { FrontSide, Side } from 'three';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable()
export class MaterialManagerService {

  readonly #materials = new Map(
    inject(MATERIAL_SERVICES)
      .map(service => [service.type, service]),
  );
  readonly #defaultMaterialType = 'normal';

  readonly #currentMaterial = signal(this.#materials.get(this.#defaultMaterialType)!);
  readonly currentMaterial$ = toObservable(this.#currentMaterial);
  readonly currentMaterial = this.#currentMaterial.asReadonly();
  readonly currentMaterialType = computed(() => this.currentMaterial().type);

  readonly #materialSide = signal<Side>(FrontSide);
  readonly materialSide = this.#materialSide.asReadonly();
  readonly materialSide$ = toObservable(this.#materialSide);

  readonly materialOptions = Object.freeze(
    [...this.#materials.values()].map(({ type, description }) => ({ type, description })),
  )

  constructor() {
    if (!untracked(this.#currentMaterial)) {
      throw new Error('#currentTool failed to find default material service');
    }
  }

  changeMaterial(typeOfService: string) {
    const newMaterialService = this.#materials.get(typeOfService);
    if (!newMaterialService) {
      throw new Error(`Unsupported material: ${typeOfService}`);
    }

    this.#changeMaterialService(newMaterialService);
  }

  /**
   * When observed, switch to the requested material.
   * When unsubscribed, switch back to the original material.
   */
  temporarilySwitchMaterial$(to: string) {
    return new Observable<void>(subscriber => {
      const oldMaterialService = untracked(this.#currentMaterial);
      this.changeMaterial(to);

      return () => this.#changeMaterialService(oldMaterialService);
    });
  }

  #changeMaterialService(materialService: BaseMaterialService<any>) {
    this.#currentMaterial.set(materialService);
  }

  toggleDoubleSideMaterial() {
    this.#materialSide.update(materialSide => {
      const currentMaterial = untracked(this.#currentMaterial);

      return currentMaterial.toggleDoubleSideFrom(materialSide);
    });
  }
}
