import { inject, Injectable } from '@angular/core';
import { BaseMaterialService, MATERIAL_SERVICES } from './base-material.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { FrontSide, Side } from 'three';

@Injectable()
export class MaterialManagerService {

  readonly #materials = new Map(
    inject(MATERIAL_SERVICES)
      .map(service => [service.type, service]),
  );
  readonly #defaultMaterialType = 'normal';

  readonly #currentMaterialSubject = new BehaviorSubject(this.#materials.get(this.#defaultMaterialType)!);
  readonly currentMaterial$ = this.#currentMaterialSubject.asObservable();
  get currentMaterial() {
    return this.#currentMaterialSubject.value;
  }

  readonly #materialSideSubject = new BehaviorSubject<Side>(FrontSide);
  readonly materialSide$ = this.#materialSideSubject.asObservable();

  readonly materialTypes = Object.freeze([...this.#materials.keys()]);

  constructor() {
    if (!this.#currentMaterialSubject.value) {
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
      const oldMaterialService = this.#currentMaterialSubject.value;
      this.changeMaterial(to);

      return () => this.#changeMaterialService(oldMaterialService);
    });
  }

  #changeMaterialService(materialService: BaseMaterialService<any>) {
    this.#currentMaterialSubject.next(materialService);
  }

  toggleDoubleSideMaterial() {
    this.#materialSideSubject.next(
      this.#currentMaterialSubject.value.toggleDoubleSide()
    );
  }
}
