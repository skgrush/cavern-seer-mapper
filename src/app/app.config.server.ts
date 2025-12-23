import { provideServerRendering } from '@angular/ssr';
import { mergeApplicationConfig, ApplicationConfig, LOCALE_ID } from '@angular/core';
import { appConfig } from './app.config';
import { LOCAL_STORAGE } from './shared/tokens/local-storage.token';

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


const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    { provide: LOCALE_ID, useValue: 'en-BE' },
    { provide: LOCAL_STORAGE, useClass: MockStorage },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
