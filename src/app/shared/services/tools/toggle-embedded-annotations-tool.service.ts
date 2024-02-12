import { inject, Injectable } from '@angular/core';
import { BaseClickToolService } from './base-tool.service';
import { CanvasService } from '../canvas.service';
import { map } from 'rxjs';

@Injectable()
export class ToggleEmbeddedAnnotationsToolService extends BaseClickToolService {
  readonly #canvasService = inject(CanvasService);

  override readonly id = 'toggle-embedded-annotations';
  override readonly label = 'Toggle embedded annotations';
  override readonly icon$ = this.#canvasService.gridVisible$.pipe(
    map(visible => ({
      icon: 'sticky_note_2',
      fontSet: visible ? 'material-icons' : 'material-icons-outlined',
    } as const)),
  );

  override click() {
    this.#canvasService.toggleEmbeddedAnnotationsVisible();
  }
}
