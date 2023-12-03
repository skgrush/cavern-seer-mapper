import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { CanvasService } from './shared/services/canvas.service';
import { ResizeService } from './shared/services/resize.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ThemeService } from './shared/services/theme.service';
import { ModelService } from './shared/services/model.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    CanvasService,
    ResizeService,
    ThemeService,
    ModelService,
    {
      provide: ErrorHandler,
      useValue: {
        handleError: (e: any) => console.error('UNCAUGHT EXCEPTION:', e)
      } satisfies ErrorHandler,
    },
  ]
};
