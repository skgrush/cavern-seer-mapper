import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { formatBytes } from '../formatters/format-bytes';
import { SettingsService } from '../services/settings/settings.service';

@Pipe({
  name: 'bytes',
  standalone: true,
  pure: true,
})
export class BytesPipe implements PipeTransform {

  readonly #locale = inject(LOCALE_ID);
  readonly #settings = inject(SettingsService);

  transform(value: number): string;
  transform(value: undefined | null): null;
  transform(value: number | undefined | null): string | null;
  transform(value: number | undefined | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return formatBytes(
      value,
      this.#locale,
      this.#settings.byteFormat,
    );
  }
}
