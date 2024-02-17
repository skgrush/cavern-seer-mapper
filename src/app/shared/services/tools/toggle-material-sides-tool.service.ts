import { Injectable, inject } from "@angular/core";
import { map } from "rxjs";
import { FrontSide } from "three";
import { BaseClickToolService } from "./base-tool.service";
import { MaterialManagerService } from '../materials/material-manager.service';

@Injectable()
export class ToggleMaterialSidesToolService extends BaseClickToolService {
  readonly #materialManager = inject(MaterialManagerService);

  override readonly id = 'toggle-material-sides';
  override readonly label = 'Toggle double-sided';

  override readonly icon$ =
    this.#materialManager.materialSide$.pipe(
      map((side) => ({
          icon: 'layers',
          fontSet: side === FrontSide ? 'material-icons-outlined' : 'material-icons',
        } as const)),
    );

  override click() {
    this.#materialManager.toggleDoubleSideMaterial();
  }
}
