import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { defer, tap } from 'rxjs';
import { AlertService, AlertType } from './alert.service';

@Injectable()
export class ServiceWorkerService {

  readonly #swUpdate = inject(SwUpdate);
  readonly #alert = inject(AlertService);

  constructor() {
    this.#swUpdate.versionUpdates.pipe(
      takeUntilDestroyed(),
    ).subscribe(e => {
      switch (e.type) {
        case 'VERSION_DETECTED':
          console.log('Downloading new app version:', e.version.hash);
          break;
        case 'VERSION_READY':
          console.log('Current app version:', e.currentVersion.hash);
          console.log('New app version ready for use:', e.latestVersion.hash);

          this.#alert.alert(AlertType.info, `New app version available, refresh to update.`, 'X', { duration: Infinity });
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.log('Failed to install app version', e.version.hash, ':', e.error);
          break;
      }
    })
  }

  checkForUpdate() {
    return defer(() => this.#swUpdate.checkForUpdate()).pipe(
      tap(result => {
        if (!result) {
          this.#alert.alert(AlertType.info, 'App is up to date!');
        }
      }),
    );
  }
}
