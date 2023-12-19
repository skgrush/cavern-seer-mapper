import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { Vector3 } from 'three';
import { SettingsService } from './settings/settings.service';
import { DigitsInfo } from '../formatters/digits-info';
import { formatLength } from '../formatters/format-length';
import { CeilingHeightAnnotation } from '../models/annotations/ceiling-height.annotation';
import { AnnotationType } from '../models/annotation-type.enum';
import { IMetadataBaseAnnotationV0 } from '../models/manifest/types.v0';
import { BaseAnnotation } from '../models/annotations/base.annotation';

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
      default:
        throw new Error(`Unexpected AnnotationType ${manifestEntry.type}`);
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
}
