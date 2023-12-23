import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocalizeService } from '../services/localize.service';

@Pipe({
  name: 'bytes',
  standalone: true,
  pure: true,
})
export class BytesPipe implements PipeTransform {

  readonly #localize = inject(LocalizeService);

  transform(value: number): string;
  transform(value: undefined | null): null;
  transform(value: number | undefined | null): string | null;
  transform(value: number | undefined | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return this.#localize.formatBytes(value);
  }
}
