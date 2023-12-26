import { Injectable, inject } from '@angular/core';
import { Box3, Vector3 } from 'three';
import { AnnotationType } from '../models/annotation-type.enum';
import { BaseAnnotation } from '../models/annotations/base.annotation';
import { CeilingHeightAnnotation } from '../models/annotations/ceiling-height.annotation';
import { CrossSectionAnnotation, vectorAngleAroundY } from '../models/annotations/cross-section.annotation';
import { MeasureDistanceAnnotation } from '../models/annotations/measure-distance.annotation';
import { IMetadataBaseAnnotationV0 } from '../models/manifest/types.v0';
import { vector3FromSimpleVector3 } from '../models/simple-types';
import { LocalizeService } from './localize.service';

@Injectable()
export class AnnotationBuilderService {

  readonly #localize = inject(LocalizeService);

  buildAnnotationFromManifest(manifestEntry: IMetadataBaseAnnotationV0): BaseAnnotation {
    switch (manifestEntry.type) {
      case AnnotationType.ceilingHeight: {
        return this.buildCeilingHeight(
          manifestEntry.identifier,
          vector3FromSimpleVector3(manifestEntry.anchorPoint),
          manifestEntry.distance,
        );
      }
      case AnnotationType.measureDistance: {
        return this.buildMeasureDistance(
          manifestEntry.identifier,
          vector3FromSimpleVector3(manifestEntry.anchorPoint),
          manifestEntry.additionalPoints.map(vector3FromSimpleVector3),
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

  buildCrossSection(
    identifier: string,
    dimensions: Vector3,
    centerPoint: Vector3,
    angleToNorthAroundY: number,
  ) {
    return new CrossSectionAnnotation(
      identifier,
      dimensions,
      centerPoint,
      angleToNorthAroundY,
    );
  }

  buildCrossSectionFromCrosslineAndBoundingBox(
    identifier: string,
    origin: Vector3,
    dest: Vector3,
    depth: number,
    boundingBoxOfModels: Box3
  ) {
    const { min: { y: minY }, max: { y: maxY } } = boundingBoxOfModels;

    const originAtMin = origin.clone().setY(minY);
    const destAtMin = dest.clone().setY(minY);

    const height = maxY - minY;
    const width = originAtMin.distanceTo(destAtMin);
    const dimensions = new Vector3(width, height, depth);

    const vectorFromOriginToDest =
      destAtMin
        .clone()
        .sub(originAtMin);

    const angleToNorthOfBoxNormal =
      vectorAngleAroundY(new Vector3(1, 0, 0), vectorFromOriginToDest);

    const centerPoint = originAtMin
      .clone()
      .add(vectorFromOriginToDest.clone().divideScalar(2))
      .add(new Vector3(0, height / 2, 0));

    return new CrossSectionAnnotation(
      identifier,
      dimensions,
      centerPoint,
      angleToNorthOfBoxNormal,
    );
  }
}
