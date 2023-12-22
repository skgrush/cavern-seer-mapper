import { makeEnvironmentProviders } from "@angular/core";
import { SettingsService } from "./settings.service";
import { provideState } from '@ngrx/store';
import { SettingsFeture } from "./state";

export function provideSettings() {
  return makeEnvironmentProviders([
    SettingsService,
    provideState(SettingsFeture),
  ]);
}
