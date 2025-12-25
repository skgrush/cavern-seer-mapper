import { computed, inject, Injectable } from '@angular/core';
import {BaseClickToolService} from "./base-tool.service";
import {CanvasService} from "../canvas.service";

@Injectable()
export class ToggleGridToolService extends BaseClickToolService {
  readonly #canvasService = inject(CanvasService);

  override readonly id = 'toggle-grid';
  override readonly label = 'Toggle grid';
  override readonly icon = computed(() => {
    const gridVisible = this.#canvasService.gridVisible();

    return {
      icon: gridVisible ? 'grid_on' : 'grid_off',
    } as const;
  });

  override click() {
    this.#canvasService.toggleGridVisible();
  }
}
