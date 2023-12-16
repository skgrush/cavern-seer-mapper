import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { SettingsService } from '../services/settings/settings.service';
import { MeasurementSystem } from '../services/settings/measurement-system';
import { formatNumber } from '@angular/common';
import { DigitsInfo } from './digits-info';

function convertMetersToCustomary(value: number) {
  return value / 0.3408;
}

@Pipe({
  name: 'length',
  standalone: true,
  pure: true,
})
export class LengthPipe implements PipeTransform {

  readonly #settings = inject(SettingsService);
  readonly #locale = inject(LOCALE_ID);

  transform(valueInMeters: number, digitsInfo?: DigitsInfo): string;
  transform(valueInMeters: number | undefined | null, digitsInfo?: DigitsInfo): string | null;
  transform(valueInMeters: number | undefined | null, digitsInfo?: DigitsInfo): string | null {
    if (valueInMeters === null || valueInMeters === undefined) {
      return null;
    }

    const value = this.#settings.measurementSystem === MeasurementSystem.metric
      ? valueInMeters
      : convertMetersToCustomary(valueInMeters);

    const formatted = formatNumber(value, this.#locale, digitsInfo);

    const suffix = this.#settings.measurementSystem === MeasurementSystem.metric
      ? 'm'
      : 'ft';

    return `${formatted} ${suffix}`;
  }

}
