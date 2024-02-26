import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { defer, switchMap } from 'rxjs';

@Injectable()
export class ExportModelDialogOpener {

  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(EnvironmentInjector);

  exportModel$() {
    return defer(() =>
      import('./export-model-dialog.component')
    ).pipe(
      switchMap(({ ExportModelDialogComponent }) =>
        ExportModelDialogComponent.open(
          this.#dialog,
          this.#injector,
          {
            titleText: 'Export model',
          },
        ).afterClosed()
      ),
    );
  }

}
