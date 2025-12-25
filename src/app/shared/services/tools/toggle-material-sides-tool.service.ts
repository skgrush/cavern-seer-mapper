import { Injectable, inject, computed } from '@angular/core';
import { FrontSide } from "three";
import { BaseClickToolService } from "./base-tool.service";
import { MaterialManagerService } from '../materials/material-manager.service';

@Injectable()
export class ToggleMaterialSidesToolService extends BaseClickToolService {
  readonly #materialManager = inject(MaterialManagerService);

  override readonly id = 'toggle-material-sides';
  override readonly label = 'Toggle double-sided';

  override readonly icon = computed(() => {
    const materialSide = this.#materialManager.materialSide();

    return {
      icon: 'layers',
      fontSet: materialSide === FrontSide ? 'material-icons-outlined' : 'material-icons',
    } as const;
  });

  override click() {
    this.#materialManager.toggleDoubleSideMaterial();
  }
}
