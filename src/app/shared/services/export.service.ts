import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { defer, first, map, of, switchMap, tap, timer } from 'rxjs';
import { ModelManagerService } from './model-manager.service';
import { ModelLoadService } from './model-load.service';
import { TransportProgressHandler } from '../models/transport-progress-handler';
import { CanvasService } from './canvas.service';

@Injectable()
export class ExportService {

  readonly #document = inject(DOCUMENT);
  readonly #modelManager = inject(ModelManagerService);
  readonly #modelLoad = inject(ModelLoadService);
  readonly #canvasService = inject(CanvasService);

  /**
   * Trigger a browser download of the currentOpenGroup.
   *
   * @returns Observable of a descriptive object on success or undefined if there is no group.
   *  The observable will raise any errors during the zip process.
   */
  downloadCurrentModelZip$(
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
        const name = this.normalizeName(fileName, currentGroup.identifier, '.zip');
        const size = blob.size;

        return this.downloadBlob$(name, blob).pipe(
          map(() => ({ name, size })),
        );
      }),
    )
  }

  downloadCanvasImage$(baseName: string, ext: 'png' | 'jpeg' | 'webp', sizeMultiplier?: number, quality?: number) {
    const type = `image/${ext}` as const;
    return defer(() => this.#canvasService.exportToImage(type, sizeMultiplier, quality)).pipe(
      switchMap(blob => {
        if (blob.type && blob.type !== type) {
          console.info('Seems browser does not support', ext, '; defaulting...');
          ext = blob.type.slice(6) as typeof ext;
        }
        const name = this.normalizeName(null, baseName, `.${ext}`);
        const size = blob.size;
        return this.downloadBlob$(name, blob).pipe(
          map(() => ({ name, size })),
        );
      }),
    );
  }

  downloadBlob$(filename: string, blob: Blob) {
    return defer(() => {
      const url = URL.createObjectURL(blob);

      const anchor = this.#document.createElement('a');
      anchor.href = url;
      anchor.download = filename;

      anchor.click();

      return timer(10).pipe(
        tap(() => URL.revokeObjectURL(url)),
      )
    });
  }

  normalizeName(inputName: string | null, groupIdentifier: string, extension: `.${string}`) {
    // if inputName is falsy, use groupIdentifier
    const name = inputName || groupIdentifier;

    if (name.toLowerCase().endsWith(extension)) {
      return name;
    }
    return `${name}${extension}`;
  }
}
