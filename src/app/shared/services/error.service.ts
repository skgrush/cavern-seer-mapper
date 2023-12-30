import { ErrorHandler, Injectable, inject } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';

class UncaughtError extends Error {

  constructor(subError: any) {
    super(`Uncaught error: ${subError}`);
  }
}

@Injectable()
export class ErrorService implements ErrorHandler {
  handleError(error: any): void {
    console.error('uncaught', error);
    this.alertError(new UncaughtError(error));
  }

  readonly #snackbar = inject(MatSnackBar);

  alertError(error: Error) {
    console.error(error);
    this.#snackbar.open(`${error}`, 'X', {
      duration: Infinity,
      panelClass: 'error-snack-panel',
    });
  }
}
