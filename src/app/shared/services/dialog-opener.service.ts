import { inject, Injectable, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

/**
 * Service solely responsible for opening dialogs
 */
@Injectable()
export class DialogOpenerService {

  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(Injector);

  exportModel() {
    import('../../dialogs/export-model-dialog/export-model-dialog.component')
      .then(({ ExportModelDialogComponent }) => {
        ExportModelDialogComponent.open(
          this.#dialog,
          this.#injector,
          {
            titleText: 'Export model',
          },
        )
      });
  }
}
