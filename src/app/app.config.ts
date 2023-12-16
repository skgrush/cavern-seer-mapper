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

export class MockStorage implements Storage {

  #values = new Map<string, string>();
  get length() { return this.#values.size; }

  clear() {
    this.#values.clear();
  }
  getItem(key: string) {
    return this.#values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.#values.set(key, value);
  }
  removeItem(key: string) {
    this.#values.delete(key);
  }
  key(idx: number) {
    return [...this.#values.keys()][idx] ?? null;
  }
}


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
    toolsProviders(),
    provideSettings(),
    { provide: LOCALE_ID, useValue: globalThis.navigator?.language ?? 'en-BE' },
    { provide: INTL_LOCALE, useFactory: (locale: string) => new Intl.Locale(locale), deps: [LOCALE_ID] },
    { provide: LOCAL_STORAGE, useValue: globalThis.localStorage ?? new MockStorage() },
    {
      provide: ErrorHandler,
      useValue: {
        handleError: (e: any) => console.error('UNCAUGHT EXCEPTION:', e)
      } satisfies ErrorHandler,
    },
  ],
};
