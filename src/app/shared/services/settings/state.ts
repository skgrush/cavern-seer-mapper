import { createFeature, createReducer, on, createActionGroup, props } from '@ngrx/store';
import { MeasurementSystem } from './measurement-system';
import { ByteFormatType } from '../localize.service';

export type ISettingsState = {
  readonly initialized: boolean;
  readonly measurementSystem: MeasurementSystem;
  readonly byteFormat: ByteFormatType;
};
export type StateOtherThanInitialize = Omit<ISettingsState, 'initialized'>;

export const initialState = {
  initialized: false,
  measurementSystem: MeasurementSystem.metric,
  byteFormat: ByteFormatType.binary,
} as const satisfies ISettingsState;

export const SettingsActions = createActionGroup({
  source: 'Settings',
  events: {
    'Initialize': props<{ partialState: Partial<StateOtherThanInitialize> }>(),
    'Update measurementSystem': props<{ measurementSystem: MeasurementSystem }>(),
    'Update byteFormat': props<{ byteFormat: ByteFormatType }>(),
  },
});

export const SettingsFeture = createFeature({
  name: 'Settings',
  reducer: createReducer(
    initialState as ISettingsState,
    on(SettingsActions.initialize, (state, { partialState }) => ({
      ...state,
      ...partialState,
      initialized: true,
    })),
    on(SettingsActions.updateMeasurementSystem, (state, { measurementSystem }) => ({
      ...state,
      measurementSystem,
    })),
    on(SettingsActions.updateByteFormat, (state, { byteFormat }) => ({
      ...state,
      byteFormat,
    })),
  ),
});

