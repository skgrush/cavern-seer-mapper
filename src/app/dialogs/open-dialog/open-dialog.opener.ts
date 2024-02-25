import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { defer, map, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { FileTypeService } from '../../shared/services/file-type.service';
import { ignoreNullish } from '../../shared/operators/ignore-nullish';
import { ModelManagerService } from '../../shared/services/model-manager.service';

@Injectable()
export class OpenDialogOpener {
  readonly #dialog = inject(MatDialog);
  readonly #fileTypeService = inject(FileTypeService);
  readonly #injector = inject(EnvironmentInjector);
  readonly #modelManager = inject(ModelManagerService);

  openAFile$() {
    return defer(
      () => import('./open-dialog.component')
    ).pipe(
      switchMap(({ OpenDialogComponent }) =>
        OpenDialogComponent
          .open(this.#dialog, this.#injector, {
            submitText: 'Open',
            titleText: 'Open a file',
            multiple: false,
            accept: this.#fileTypeService.getAllExtensionsAndMimes().join(','),
          }).afterClosed(),
      ),
      ignoreNullish(),
      map(result => this.#modelManager.resetToNonGroupModel(result[0])),
    );
  }

  importFiles$(initialFiles?: FileList) {
    return defer(
      () => import('../../dialogs/open-dialog/open-dialog.component'),
    ).pipe(
      switchMap(({ OpenDialogComponent }) =>
        OpenDialogComponent
          .open(this.#dialog, this.#injector, {
            submitText: 'Import',
            titleText: 'Import one or more files',
            multiple: true,
            accept: this.#fileTypeService.getAllExtensionsAndMimes().join(','),
            initialFiles,
          }).afterClosed()
      ),
      ignoreNullish(),
      map(result => this.#modelManager.importModels(result)),
    );
  }
}
