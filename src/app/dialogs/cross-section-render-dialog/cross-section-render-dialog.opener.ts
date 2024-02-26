import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { ICrossSectionRenderDialogData } from './cross-section-render-dialog.component';
import { defer, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';


@Injectable()
export class CrossSectionRenderDialogOpener {

  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(EnvironmentInjector);

  exportCrossSection(data: ICrossSectionRenderDialogData) {
    return defer(() =>
      import('./cross-section-render-dialog.component')
    ).pipe(
      switchMap(({ CrossSectionRenderDialogComponent }) =>
        CrossSectionRenderDialogComponent
          .open(this.#dialog, this.#injector, data)
          .afterClosed()
      )
    )
  }
}
