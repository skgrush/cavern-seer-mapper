import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { SettingsService } from './settings/settings.service';
import { MeasurementSystem } from './settings/measurement-system';

export enum ByteFormatType {
  binary = 'binary',
  decimal = 'decimal',
}

export enum ByteDivisor {
  decimal = 1000,
  binary = 1024,
}

export const allByteUnits = Object.freeze({
  [ByteFormatType.binary]: Object.freeze(['B', 'KiB', 'MiB', 'GiB', 'TiB'] as const),
  [ByteFormatType.decimal]: Object.freeze(['B', 'kB', 'MB', 'GB', 'TB'] as const),
} as const);
export type ByteUnit = typeof allByteUnits[ByteFormatType][number];


type SupportedUnit =
  | 'meter'
  | 'foot';

@Injectable()
export class LocalizeService {

  readonly #whitespace = '\u8239';
  readonly #settings = inject(SettingsService);
  readonly #localeId = inject(LOCALE_ID);

  readonly #unitLengthLookup = new Map<`${SupportedUnit}-${number}-${number}`, Intl.NumberFormat>();
  readonly #decimalLookup = new Map<`${number}-${number}`, Intl.NumberFormat>();

  metersToFeet(valueInMeters: number) {
    return valueInMeters / 0.3408;
  }

  /**
   * Format a value in meters to the local units.
   */
  formatLength(valueInMeters: number, minimumFractionDigits = 1, maximumFractionDigits = 2) {

    const [value, unit] =
      this.#settings.measurementSystem === MeasurementSystem.metric
        ? [valueInMeters, 'meter'] as const
        : [this.metersToFeet(valueInMeters), 'foot'] as const;

    const mapKey = `${unit}-${minimumFractionDigits}-${maximumFractionDigits}` as const;

    const formatter = this.getOrAddMap(
      this.#unitLengthLookup,
      mapKey,
      () => new Intl.NumberFormat(this.#localeId, {
        style: 'unit',
        unit,
        minimumFractionDigits,
        maximumFractionDigits,
      }),
    );

    debugger;
    return formatter.format(value);
  }

  formatNumber(value: number, minimumFractionDigits = 1, maximumFractionDigits = 2) {
    const formatter = this.getOrAddMap(
      this.#decimalLookup,
      '2-3',
      () => new Intl.NumberFormat(this.#localeId, {
        style: 'decimal',
        minimumFractionDigits,
        maximumFractionDigits,
      }),
    );

    return formatter.format(value);
  }

  formatBytes(bytes: number) {
    const type = this.#settings.byteFormat;

    const units = allByteUnits[type];

    const divisor = ByteDivisor[type];

    const power = (bytes === 0 || !Number.isFinite(bytes))
      ? 0
      : Math.min(
        Math.floor(Math.log(Math.abs(bytes)) / Math.log(divisor)),
        units.length - 1,
      );

    const coefficient = bytes / (divisor ** power);
    const unit = units[power];

    const formattedCoefficient = this.formatNumber(coefficient, 2, 3);

    return `${formattedCoefficient} ${unit}`;
  }

  getOrAddMap<TKey, TValue extends Intl.NumberFormat>(
    map: Map<TKey, TValue>,
    key: TKey,
    builder: () => TValue,
  ) {
    let formatter = map.get(key);
    if (formatter) {
      return formatter;
    }

    formatter = builder();
    map.set(key, formatter);
    return formatter;
  }
}
