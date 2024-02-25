import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { defer, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Injectable()
export class SaveDialogOpener {

  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(EnvironmentInjector);

  saveOpenFile$() {
    return defer(
      () => import('./zip-download-model-dialog.component'),
    ).pipe(
      switchMap(({ ZipDownloadModelDialogComponent }) =>
        ZipDownloadModelDialogComponent.open(this.#dialog, this.#injector, {
          titleText: 'Zip and download group',
        }).afterClosed(),
      ),
    )
  }
}
