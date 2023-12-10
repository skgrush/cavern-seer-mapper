import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Subject, first, map, of, switchMap, tap, timer } from 'rxjs';
import { ModelManagerService } from './model-manager.service';
import { ModelLoadService } from './model-load.service';
import { TransportProgressHandler } from '../models/transport-progress-handler';

@Injectable()
export class ExportService {

  readonly #document = inject(DOCUMENT);
  readonly #modelManager = inject(ModelManagerService);
  readonly #modelLoad = inject(ModelLoadService);

  /**
   * Trigger a browser download of the currentOpenGroup.
   *
   * @returns Observable of a descriptive object on success or undefined if there is no group.
   *  The observable will raise any errors during the zip process.
   */
  downloadZip$(
    compressionLevel: number,
    fileName: string | null,
    progress: TransportProgressHandler,
  ) {
    return this.#modelManager.currentOpenGroup$.pipe(
      first(),
      switchMap(currentGroup => {
        if (!currentGroup) {
          return of(undefined);
        }

        return this.#modelLoad.writeGroupToZip$(
          currentGroup,
          compressionLevel,
          progress,
        ).pipe(
          map(blob => ({ blob, currentGroup }))
        );
      }),
      switchMap(info => {
        if (!info) {
          return of(info);
        }
        const { blob, currentGroup } = info;
        const name = this.normalizeName(fileName, currentGroup.identifier);
        const size = blob.size;

        const anchor = this.#document.createElement('a');
        anchor.download = name;

        const url = URL.createObjectURL(blob);
        anchor.href = url;
        anchor.click();

        return timer(10).pipe(
          tap(() => URL.revokeObjectURL(url)),
          map(() => ({ name, size })),
        );
      }),
    )
  }

  normalizeName(inputName: string | null, groupIdentifier: string) {
    // if inputName is falsy, use groupIdentifier
    const name = inputName || groupIdentifier;

    if (name.toLowerCase().endsWith('.zip')) {
      return name;
    }
    return `${name}.zip`;
  }
}
