import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogData } from './confirmation-dialog.data';
import { defer, map, switchMap } from 'rxjs';

@Injectable()
export class ConfirmationDialogService {

  readonly #dialog = inject(MatDialog);

  open(
    data: ConfirmationDialogData,
  ) {
    return defer(() => import('./confirmation-dialog.component')).pipe(
      switchMap(({ ConfirmationDialogComponent }) => this.#dialog.open<any, ConfirmationDialogData, boolean>(
        ConfirmationDialogComponent,
        {
          data,
          disableClose: true,
          autoFocus: 'first-tabbable',
        }
      ).afterClosed()),
      map(result => !!result),
    );
  }
}
