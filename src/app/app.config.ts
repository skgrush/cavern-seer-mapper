import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  importProvidersFrom,
  isDevMode,
  provideZonelessChangeDetection,
  provideCheckNoChangesConfig,
  EnvironmentProviders,
} from '@angular/core';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import versionObject from '../version.json';
import { routes } from './app.routes';
import { AlertService } from './shared/services/alert.service';
import { ErrorService } from './shared/services/error.service';
import { ServiceWorkerService } from './shared/services/service-worker.service';
import { INTL_COLLATOR } from './shared/tokens/intl-collator.token';
import { INTL_LOCALE } from './shared/tokens/intl-locale.token';
import { INTL_UNIT_LIST_FORMAT } from './shared/tokens/intl-unit-list-format.token';
import { LOCAL_STORAGE } from './shared/tokens/local-storage.token';
import { MAPPER_VERSION, VersionObject } from './shared/tokens/version.token';
import { provideHttpClient } from '@angular/common/http';
import { KeyBindService } from './shared/services/key-bind.service';
import { PlatformService } from './shared/services/platform.service';

export const appConfig: ApplicationConfig = {
  providers: [
    ngDevMode
      ? provideCheckNoChangesConfig({ exhaustive: true, interval: 100 })
      : provideCheckNoChangesConfig({ exhaustive: false })
    ,
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    ErrorService,
    AlertService,
    KeyBindService,
    PlatformService,
    importProvidersFrom(MatSnackBarModule),
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        verticalPosition: 'top',
        duration: 5e3,
      } satisfies MatSnackBarConfig,
    },
    { provide: MAPPER_VERSION, useValue: versionObject satisfies VersionObject },
    { provide: LOCALE_ID, useFactory: () => globalThis.navigator.language },
    { provide: INTL_LOCALE, useFactory: (locale: string) => new Intl.Locale(locale), deps: [LOCALE_ID] },
    { provide: INTL_COLLATOR, useFactory: (locale: string) => new Intl.Collator(locale), deps: [LOCALE_ID] },
    { provide: INTL_UNIT_LIST_FORMAT, useFactory: (locale: string) => new Intl.ListFormat(locale, { type: 'unit' }), deps: [LOCALE_ID] },
    { provide: LOCAL_STORAGE, useFactory: () => globalThis.localStorage },
    {
      provide: ErrorHandler,
      useExisting: ErrorService,
    },
    ServiceWorkerService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
};
