import { ApplicationConfig, ErrorHandler, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { CanvasService } from './shared/services/canvas.service';
import { ResizeService } from './shared/services/resize.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ThemeService } from './shared/services/theme.service';
import { ModelLoadService } from './shared/services/model-load.service';
import { MeshNormalMaterialService } from './shared/services/3d-managers/mesh-normal-material.service';
import { ModelManagerService } from './shared/services/model-manager.service';
import { FileTypeService } from './shared/services/file-type.service';
import { FileIconModule } from './shared/components/file-icon/file-icon.module';
import { ExportService } from './shared/services/export.service';
import { toolsProviders } from './shared/services/tools';
import { ToolManagerService } from './shared/services/tool-manager.service';
import { provideStore } from '@ngrx/store';
import { INTL_LOCALE } from './shared/tokens/intl-locale.token';
import { LOCAL_STORAGE } from './shared/tokens/local-storage.token';
import { provideSettings } from './shared/services/settings';
import { INTL_COLLATOR } from './shared/tokens/intl-collator.token';
import { INTL_UNIT_LIST_FORMAT } from './shared/tokens/intl-unit-list-format.token';
import { AnnotationBuilderService } from './shared/services/annotation-builder.service';



export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    provideStore(),
    CanvasService,
    ResizeService,
    ExportService,
    ThemeService,
    importProvidersFrom(FileIconModule),
    FileTypeService,
    ModelLoadService,
    ModelManagerService,
    MeshNormalMaterialService,
    ToolManagerService,
    AnnotationBuilderService,
    toolsProviders(),
    provideSettings(),
    { provide: LOCALE_ID, useFactory: () => globalThis.navigator.language },
    { provide: INTL_LOCALE, useFactory: (locale: string) => new Intl.Locale(locale), deps: [LOCALE_ID] },
    { provide: INTL_COLLATOR, useFactory: (locale: string) => new Intl.Collator(locale), deps: [LOCALE_ID] },
    { provide: INTL_UNIT_LIST_FORMAT, useFactory: (locale: string) => new Intl.ListFormat(locale, { type: 'unit' }), deps: [LOCALE_ID] },
    { provide: LOCAL_STORAGE, useFactory: () => globalThis.localStorage },
    {
      provide: ErrorHandler,
      useValue: {
        handleError: (e: any) => console.error('UNCAUGHT EXCEPTION:', e)
      } satisfies ErrorHandler,
    },
  ],
};
