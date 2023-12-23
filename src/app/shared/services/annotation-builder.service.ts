import { Injectable, inject } from '@angular/core';
import { Vector3 } from 'three';
import { AnnotationType } from '../models/annotation-type.enum';
import { BaseAnnotation } from '../models/annotations/base.annotation';
import { CeilingHeightAnnotation } from '../models/annotations/ceiling-height.annotation';
import { MeasureDistanceAnnotation } from '../models/annotations/measure-distance.annotation';
import { IMetadataBaseAnnotationV0 } from '../models/manifest/types.v0';
import { LocalizeService } from './localize.service';

@Injectable()
export class AnnotationBuilderService {

  readonly #localize = inject(LocalizeService);

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
      this.#localize,
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
