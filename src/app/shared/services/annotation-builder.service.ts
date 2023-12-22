import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { Vector3 } from 'three';
import { SettingsService } from './settings/settings.service';
import { DigitsInfo } from '../formatters/digits-info';
import { formatLength } from '../formatters/format-length';
import { CeilingHeightAnnotation } from '../models/annotations/ceiling-height.annotation';
import { AnnotationType } from '../models/annotation-type.enum';
import { IMetadataBaseAnnotationV0 } from '../models/manifest/types.v0';
import { BaseAnnotation } from '../models/annotations/base.annotation';
import { MeasureDistanceAnnotation } from '../models/annotations/measure-distance.annotation';

@Injectable()
export class AnnotationBuilderService {

  readonly #localeId = inject(LOCALE_ID);
  readonly #settings = inject(SettingsService);

  readonly #ceilingHeightLengthFormat = (valueInMeters: number, digitsInfo?: DigitsInfo) =>
    formatLength(this.#settings.measurementSystem, this.#localeId, valueInMeters, digitsInfo);

  buildAnnotationFromManifest(manifestEntry: IMetadataBaseAnnotationV0): BaseAnnotation {
    switch (manifestEntry.type) {
      case AnnotationType.ceilingHeight: {
        const { x, y, z } = manifestEntry.anchorPoint;
        return this.buildCeilingHeight(
          manifestEntry.identifier,
          new Vector3(x, y, z),
          manifestEntry.distance,
        );
      }
      case AnnotationType.measureDistance: {
        const { x, y, z } = manifestEntry.anchorPoint;
        return this.buildMeasureDistance(
          manifestEntry.identifier,
          new Vector3(x, y, z),
          manifestEntry.additionalPoints.map(({ x, y, z }) => new Vector3(x, y, z)),
        );
      }
      default: {
        const { type } = manifestEntry as IMetadataBaseAnnotationV0;
        throw new Error(`Unexpected AnnotationType ${type}`);
      }
    }
  }

  buildCeilingHeight(
    identifier: string,
    floorPointLocal: Vector3,
    distance: number,
  ) {
    return new CeilingHeightAnnotation(
      identifier,
      floorPointLocal,
      distance,
      this.#ceilingHeightLengthFormat,
    );
  }

  buildMeasureDistance(
    identifier: string,
    floorPointLocal: Vector3,
    additionalPoints: readonly Vector3[],
  ) {
    return new MeasureDistanceAnnotation(
      identifier,
      floorPointLocal,
      additionalPoints,
    );
  }
}
