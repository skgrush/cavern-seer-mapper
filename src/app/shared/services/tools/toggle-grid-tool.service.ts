import {inject, Injectable} from '@angular/core';
import {BaseClickToolService} from "./base-tool.service";
import {map} from "rxjs";
import {CanvasService} from "../canvas.service";

@Injectable()
export class ToggleGridToolService extends BaseClickToolService {
  readonly #canvasService = inject(CanvasService);

  override readonly id = 'toggle-grid';
  override readonly label = 'Toggle grid';
  override readonly icon$ = this.#canvasService.gridVisible$.pipe(
    map(visible => ({
      icon: visible ? 'grid_on' : 'grid_off',
    })),
  );

  override click() {
    this.#canvasService.toggleGridVisible();
  }
}
