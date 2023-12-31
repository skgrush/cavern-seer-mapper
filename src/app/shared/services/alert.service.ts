import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export enum AlertType {
  error = 1,
  info = 2,
}

@Injectable()
export class AlertService {

  readonly #snackBar = inject(MatSnackBar);

  /**
   * Open snackbar alert with the given parameters.
   */
  alert(type: AlertType, message: string, action?: string, config?: MatSnackBarConfig) {

    const cls = `snack-panel-${AlertType[type]}`;

    return this.#snackBar.open(message, action, {
      ...config,
      panelClass: [...config?.panelClass ?? [], cls],
    }).afterDismissed();
  }
}
