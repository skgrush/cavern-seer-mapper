import { ErrorHandler, Injectable, inject } from '@angular/core';

import { AlertService, AlertType } from './alert.service';

class UncaughtError extends Error {

  constructor(subError: any) {
    super(`Uncaught error: ${subError}`);
  }
}

@Injectable()
export class ErrorService implements ErrorHandler {
  handleError(error: any): void {
    console.error('uncaught', error);
    if (ngDevMode && error && typeof error.code === 'number' && error.message?.startsWith('NG')) {
      debugger;
      return;
    }
    this.alertError(new UncaughtError(error));
  }

  readonly #alert = inject(AlertService);

  alertError(error: Error) {
    console.error(error);
    this.#alert.alert(AlertType.error, `${error}`, 'X', {
      duration: Infinity,
    });
  }
}
