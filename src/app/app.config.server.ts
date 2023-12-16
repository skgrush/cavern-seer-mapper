import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { INTL_LOCALE } from './shared/tokens/intl-locale.token';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    { provide: INTL_LOCALE, useValue: new Intl.Locale('en-BE') },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
