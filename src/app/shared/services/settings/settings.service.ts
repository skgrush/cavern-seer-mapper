import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ISettingsState, SettingsActions, SettingsFeture, StateOtherThanInitialize, initialState } from './state';
import { Mutable } from '../../types/mutable';
import { INTL_LOCALE } from '../../tokens/intl-locale.token';
import { LOCAL_STORAGE } from '../../tokens/local-storage.token';
import { MeasurementSystem } from './measurement-system';
import { distinctUntilChanged, filter, map, tap } from 'rxjs';

@Injectable()
export class SettingsService {

  readonly #storageKey = '__MAPPER:SETTINGS';

  readonly #store = inject(Store);
  readonly #intlLocale = inject(INTL_LOCALE);
  readonly #storage = inject(LOCAL_STORAGE);

  readonly state$ = this.#store.select(SettingsFeture.selectSettingsState).pipe(
    filter(state => state.initialized),
  );

  readonly measurementSystem$ = this.state$.pipe(
    map(s => s.measurementSystem),
    distinctUntilChanged(),
  );

  constructor() {
    this.initialize();
    this.state$.pipe(
      tap(state => this.#storage.setItem(this.#storageKey, JSON.stringify(state))),
    ).subscribe();
  }

  initialize() {
    const partialState = this.#parseStorageState();

    // if we haven't stored off the measurementSystem yet, base it on the user's locale
    if (!('measurementSystem' in partialState)) {
      partialState.measurementSystem =
        this.#intlLocale.region?.startsWith('US')
          ? MeasurementSystem.usCustomary
          : MeasurementSystem.metric;
    }

    this.#store.dispatch(SettingsActions.initialize({ partialState }));
  }

  updateSettings(partialStateInput: Partial<StateOtherThanInitialize>) {
    const partialState = { ...partialStateInput };
    for (const k of Object.keys(partialState) as Array<keyof typeof partialState>) {
      if (partialState[k] === undefined || !(k in initialState)) {
        delete partialState[k];
      }
    }

    this.#store.dispatch(SettingsActions.initialize({ partialState }));
  }

  // updateSetting<const K extends keyof StateOtherThanInitialize>(key: K, value: ISettingsState[K]) {
  //   if (key === 'measurementSystem') {
  //     this.#store.dispatch(SettingsActions.updateMeasurementSystem({ measurementSystem: value }));
  //   }
  // }

  #parseStorageState(): Partial<Mutable<ISettingsState>> {
    const storedValue = this.#storage.getItem(this.#storageKey);

    if (!storedValue) {
      return {};
    }

    try {
      const state = JSON.parse(storedValue);
      for (const key in state) {
        if (!(key in initialState)) {
          delete state[key];
        }
      }

      return state;
    } catch (e) {
      console.error('Error parsing', this.#storageKey, 'JSON from storage:', storedValue);
    }

    return {};
  }
}


