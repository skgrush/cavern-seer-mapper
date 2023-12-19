import { AnnotationType } from "../annotation-type.enum";
import { ISimpleVector3 } from "../simple-types";


export type IMetadataCeilingHeightV0 = {
  readonly type: AnnotationType.ceilingHeight;
  readonly identifier: string;
  readonly anchorPoint: ISimpleVector3;
  readonly distance: number;
}
export type IMetadataMeasureDistanceV0 = {
  readonly type: AnnotationType.measureDistance;
  readonly identifier: string;
  readonly anchorPoint: ISimpleVector3;
  readonly additionalPoints: readonly ISimpleVector3[];
};
export type IMetadataBaseAnnotationV0 = IMetadataCeilingHeightV0 | IMetadataMeasureDistanceV0;

export type IMetadataEntryV0 = {
  readonly position: ISimpleVector3,
  readonly annotations?: readonly IMetadataBaseAnnotationV0[];
}
