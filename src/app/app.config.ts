import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { CanvasService } from './shared/services/canvas.service';
import { ResizeService } from './shared/services/resize.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ThemeService } from './shared/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    CanvasService,
    ResizeService,
    ThemeService,
  ]
};
