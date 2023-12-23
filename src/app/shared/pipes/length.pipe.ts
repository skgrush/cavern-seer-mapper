import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocalizeService } from '../services/localize.service';

@Pipe({
  name: 'length',
  standalone: true,
  pure: true,
})
export class LengthPipe implements PipeTransform {

  readonly #localize = inject(LocalizeService);

  transform(valueInMeters: number, minDec?: number, maxDec?: number): string;
  transform(valueInMeters: number | undefined | null, minDec?: number, maxDec?: number): string | null;
  transform(valueInMeters: number | undefined | null, minDec?: number, maxDec?: number): string | null {
    if (valueInMeters === null || valueInMeters === undefined) {
      return null;
    }

    return this.#localize.formatLength(valueInMeters, minDec, maxDec);
  }

}
