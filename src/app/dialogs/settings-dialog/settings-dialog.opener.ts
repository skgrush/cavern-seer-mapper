import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { defer, switchMap } from 'rxjs';

@Injectable()
export class SettingsDialogOpener {

  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(EnvironmentInjector);

  openSettings$() {
    return defer(() =>
      import('./settings-dialog.component'),
    ).pipe(
      switchMap(({ SettingsDialogComponent }) =>
        SettingsDialogComponent.open(this.#dialog, this.#injector)
          .afterClosed()
      ),
    );
  }
}
