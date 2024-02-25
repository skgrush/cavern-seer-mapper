import { inject, Injectable, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

/**
 * Service solely responsible for opening dialogs
 */
@Injectable()
export class DialogOpenerService {

  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(Injector);

  settings() {
    import('../../dialogs/settings-dialog/settings-dialog.component')
      .then(({ SettingsDialogComponent }) => {
        SettingsDialogComponent.open(this.#dialog, this.#injector);
      });
  }

  exportImage() {
    import('../../dialogs/export-image-dialog/export-image-dialog.component')
      .then(({ ExportImageDialogComponent }) => {
        ExportImageDialogComponent.open(
          this.#dialog,
          this.#injector,
          {
            titleText: 'Export image',
          },
        );
      });
  }

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
