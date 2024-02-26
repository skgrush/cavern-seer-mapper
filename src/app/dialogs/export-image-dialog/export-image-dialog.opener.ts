import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { defer, switchMap } from 'rxjs';

@Injectable()
export class ExportImageDialogOpener {

  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(EnvironmentInjector);

  exportImage$() {
    return defer(() =>
      import('./export-image-dialog.component')
    ).pipe(
      switchMap(({ ExportImageDialogComponent }) =>
        ExportImageDialogComponent.open(
          this.#dialog,
          this.#injector,
          {
            titleText: 'Export image',
          },
        ).afterClosed()
      ),
    )
  }
}
