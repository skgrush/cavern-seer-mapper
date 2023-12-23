import { Pipe, PipeTransform, inject } from '@angular/core';
import { Vector2, Vector3 } from 'three';
import { LocalizeService } from '../services/localize.service';
import { INTL_UNIT_LIST_FORMAT } from '../tokens/intl-unit-list-format.token';

@Pipe({
  name: 'vector',
  standalone: true,
  pure: true,
})
export class VectorPipe implements PipeTransform {
  readonly #localize = inject(LocalizeService);
  readonly #unitListFormat = inject(INTL_UNIT_LIST_FORMAT);

  transform(value: Vector3 | Vector2, minimumFractionDigits = 1, maximumFractionDigits = 2): string {
    const ary: number[] = [];
    value.toArray(ary);

    const parts = ary.map(p => this.#localize.formatNumber(p, minimumFractionDigits, maximumFractionDigits));

    return this.#unitListFormat.format(parts);
  }
}
