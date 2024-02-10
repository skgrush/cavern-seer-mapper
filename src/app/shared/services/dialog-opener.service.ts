import { Injectable, Injector, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModelManagerService } from './model-manager.service';
import { ICrossSectionRenderDialogData } from '../../dialogs/cross-section-render-dialog/cross-section-render-dialog.component';
import { defer, switchMap } from 'rxjs';

/**
 * Service solely responsible for opening dialogs
 */
@Injectable()
export class DialogOpenerService {

  readonly #modelManager = inject(ModelManagerService);
  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(Injector);

  open() {
    import('../../dialogs/open-dialog/open-dialog.component')
      .then(({ OpenDialogComponent }) => {
        OpenDialogComponent.open(this.#dialog, this.#injector, {
          submitText: 'Open',
          titleText: 'Open a file',
          multiple: false,
        }).afterClosed().subscribe(result => {
          if (result) {
            this.#modelManager.resetToNonGroupModel(result[0]);
          }
        });
      });
  }

  exportCrossSection(data: ICrossSectionRenderDialogData) {
    return defer(() => import('../../dialogs/cross-section-render-dialog/cross-section-render-dialog.component')).pipe(
      switchMap(({ CrossSectionRenderDialogComponent }) => {
        return CrossSectionRenderDialogComponent.open(this.#dialog, this.#injector, data).afterClosed();
      })
    )
  }

  import(initialFiles?: FileList) {
    import('../../dialogs/open-dialog/open-dialog.component')
      .then(({ OpenDialogComponent }) => {
        OpenDialogComponent.open(this.#dialog, this.#injector, {
          submitText: 'Import',
          titleText: 'Import one or more files',
          multiple: true,
          initialFiles,
        }).afterClosed().subscribe(result => {
          if (result) {
            this.#modelManager.importModels(result);
          }
        });
      });
  }

  save() {
    import('../../dialogs/zip-download-model-dialog/zip-download-model-dialog.component')
      .then(({ ZipDownloadModelDialogComponent }) => {
        ZipDownloadModelDialogComponent.open(this.#dialog, this.#injector, {
          titleText: 'Zip and download group',
        });
      });
  }

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
