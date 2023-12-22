import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { Vector2, Vector3 } from 'three';
import { DigitsInfo } from '../formatters/digits-info';
import { formatNumber } from '@angular/common';
import { INTL_UNIT_LIST_FORMAT } from '../tokens/intl-unit-list-format.token';

@Pipe({
  name: 'vector',
  standalone: true
})
export class VectorPipe implements PipeTransform {
  readonly #locale = inject(LOCALE_ID);
  readonly #unitListFormat = inject(INTL_UNIT_LIST_FORMAT);

  transform(value: Vector3 | Vector2, digitsInfo?: DigitsInfo): string {
    const ary: number[] = [];
    value.toArray(ary);

    const parts = ary.map(p => formatNumber(p, this.#locale, digitsInfo));

    return this.#unitListFormat.format(parts);
  }

}
