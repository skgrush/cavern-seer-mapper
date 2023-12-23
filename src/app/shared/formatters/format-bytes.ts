import { formatNumber } from "@angular/common";

export enum ByteFormatType {
  binary = 'binary',
  decimal = 'decimal',
}

export enum ByteDivisor {
  decimal = 1000,
  binary = 1024,
}

export const allByteUnits = Object.freeze({
  'binary': Object.freeze(['B', 'KiB', 'MiB', 'GiB', 'TiB'] as const),
  'decimal': Object.freeze(['B', 'kB', 'MB', 'GB', 'TB'] as const),
} as const);
export type ByteUnit = typeof allByteUnits[ByteFormatType][number];

export function formatBytes(
  bytes: number,
  locale: string,
  type: ByteFormatType = ByteFormatType.binary
) {
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

  const formattedCoefficient = formatNumber(coefficient, locale, '1.2-3');

  return `${formattedCoefficient} ${unit}`;
}
