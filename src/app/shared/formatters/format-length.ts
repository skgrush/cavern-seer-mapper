import { formatNumber } from "@angular/common";
import { MeasurementSystem } from "../services/settings/measurement-system";
import { DigitsInfo } from "./digits-info";

function convertMetersToFeet(value: number) {
  return value / 0.3408;
}

export function formatLength(
  measurementSystem: MeasurementSystem,
  localeId: string,
  valueInMeters: number,
  digitsInfo?: DigitsInfo,
) {
  const value =
    measurementSystem === MeasurementSystem.metric
      ? valueInMeters
      : convertMetersToFeet(valueInMeters);

  const formatted = formatNumber(value, localeId, digitsInfo);

  const suffix =
    measurementSystem === MeasurementSystem.metric
      ? 'm'
      : 'ft';

  return `${formatted} ${suffix}`;
}
