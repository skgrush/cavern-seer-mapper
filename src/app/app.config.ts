import { ApplicationConfig, ErrorHandler, LOCALE_ID, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { provideStore } from '@ngrx/store';
import { routes } from './app.routes';
import { FileIconModule } from './shared/components/file-icon/file-icon.module';
import { MeshNormalMaterialService } from './shared/services/3d-managers/mesh-normal-material.service';
import { AlertService } from './shared/services/alert.service';
import { AnnotationBuilderService } from './shared/services/annotation-builder.service';
import { CanvasService } from './shared/services/canvas.service';
import { DialogOpenerService } from './shared/services/dialog-opener.service';
import { ErrorService } from './shared/services/error.service';
import { ExportService } from './shared/services/export.service';
import { FileTypeService } from './shared/services/file-type.service';
import { LocalizeService } from './shared/services/localize.service';
import { ModelLoadService } from './shared/services/model-load.service';
import { ModelManagerService } from './shared/services/model-manager.service';
import { ResizeService } from './shared/services/resize.service';
import { ServiceWorkerService } from './shared/services/service-worker.service';
import { provideSettings } from './shared/services/settings';
import { ThemeService } from './shared/services/theme.service';
import { ToolManagerService } from './shared/services/tool-manager.service';
import { toolsProviders } from './shared/services/tools';
import { INTL_COLLATOR } from './shared/tokens/intl-collator.token';
import { INTL_LOCALE } from './shared/tokens/intl-locale.token';
import { INTL_UNIT_LIST_FORMAT } from './shared/tokens/intl-unit-list-format.token';
import { LOCAL_STORAGE } from './shared/tokens/local-storage.token';



export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideStore(),
    CanvasService,
    ResizeService,
    ExportService,
    ThemeService,
    importProvidersFrom(FileIconModule),
    FileTypeService,
    LocalizeService,
    ModelLoadService,
    ModelManagerService,
    MeshNormalMaterialService,
    ToolManagerService,
    AnnotationBuilderService,
    DialogOpenerService,
    ErrorService,
    AlertService,
    importProvidersFrom(MatSnackBarModule),
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        verticalPosition: 'top',
        duration: 5e3,
      } satisfies MatSnackBarConfig,
    },
    toolsProviders(),
    provideSettings(),
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
    })
  ],
};
