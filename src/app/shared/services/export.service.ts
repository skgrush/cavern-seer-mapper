import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, switchMap, tap, timer } from 'rxjs';
import { ModelManagerService } from './model-manager.service';
import { ModelLoadService } from './model-load.service';

@Injectable()
export class ExportService {

  readonly #document = inject(DOCUMENT);
  readonly #modelManager = inject(ModelManagerService);
  readonly #modelLoad = inject(ModelLoadService);

  downloadZip$(compressionLevel: number) {
    alert('This is experimental and can take a SIGNIFICANT amount of time. Do not change the model until the button is re-enabled!');
    return this.#modelManager.currentOpenGroup$.pipe(
      switchMap(currentGroup => {
        if (!currentGroup) {
          return of(undefined);
        }

        return this.#modelLoad.writeGroupToZip$(
          currentGroup,
          compressionLevel,
        ).pipe(
          map(blob => ({ blob, currentGroup }))
        );
      }),
      switchMap(info => {
        if (!info) {
          return of(info);
        }
        const { blob, currentGroup } = info;

        const anchor = this.#document.createElement('a');
        anchor.download = currentGroup.identifier;

        const url = URL.createObjectURL(blob);
        anchor.href = url;
        anchor.click();

        return timer(10).pipe(
          tap(() => URL.revokeObjectURL(url)),
          map(() => true),
        );
      }),
      catchError(err => {
        console.error('Error downloading zip', err);
        return of(false);
      })
    )
  }
}
