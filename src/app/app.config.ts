import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { CanvasService } from './shared/services/canvas.service';
import { ResizeService } from './shared/services/resize.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    CanvasService,
    ResizeService,
  ]
};
