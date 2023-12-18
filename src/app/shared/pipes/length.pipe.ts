import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { SettingsService } from '../services/settings/settings.service';
import { DigitsInfo } from '../formatters/digits-info';
import { formatLength } from '../formatters/format-length';



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

    return formatLength(
      this.#settings.measurementSystem,
      this.#locale,
      valueInMeters,
      digitsInfo,
    );
  }

}
