import { Injectable, inject } from "@angular/core";
import { map } from "rxjs";
import { FrontSide } from "three";
import { CanvasService } from "../canvas.service";
import { BaseClickToolService } from "./base-tool.service";

@Injectable()
export class ToggleMaterialSidesToolService extends BaseClickToolService {
  readonly #canvasService = inject(CanvasService);

  override readonly id = 'toggle-material-sides';
  override readonly label = 'Toggle double-sided';
  override readonly icon = 'layers';

  override readonly fontSet$ =
    this.#canvasService.materialSide$.pipe(
      map(side => {
        switch (side) {
          case FrontSide:
            return 'material-icons-outlined';
          default:
            return 'material-icons';
        }
      }),
    );

  override click() {
    this.#canvasService.toggleDoubleSideMaterial();
  }
}
