import type { Uuid } from '@skgrush/bplist-and-nskeyedunarchiver/bplist';
import type { Float3, Float4x4 } from '@skgrush/bplist-and-nskeyedunarchiver/NSKeyedUnarchiver';

export type ScanFile = {
  readonly encodingVersion: bigint;
  readonly timestamp: Date;
  readonly name: string;
  readonly center: Float3;
  readonly extent: Float3;
  readonly meshAnchors: CSMeshSlice[];
  readonly startSnapshot: CSMeshSnapshot | null;
  readonly endSnapshot: CSMeshSnapshot | null;
  readonly stations: SurveyStation[];
  readonly lines: SurveyLine[];

  // readonly location: CSLocation | null;
}

export type CSMeshSlice = {
  readonly identifier: Uuid;
  readonly transform: Float4x4;
  readonly vertices: CSMeshGeometrySource;
  readonly faces: CSMeshGeometryElement;
  readonly normals: CSMeshGeometrySource;
}

export type CSMeshSnapshot = {
  readonly imageData: ArrayBuffer;
  readonly transform: Float4x4;
  readonly identifier: Uuid;
  readonly name: string | null;
}

export type SurveyLine = {
  readonly startIdentifier: Uuid;
  readonly endIdentifier: Uuid;
}

export type SurveyStation = {
  readonly name: string;
  readonly identifier: Uuid;
  readonly transform: Float4x4;
}

export type CSMeshGeometrySource = {
  readonly semantic: string;

  readonly bytesPerComponent: bigint;
  readonly componentsPerVector: bigint;

  readonly data: ArrayBuffer;
  readonly count: bigint;
  readonly format: bigint;
  readonly offset: bigint;
  readonly stride: bigint;
}

export type CSMeshGeometryElement = {
  readonly data: ArrayBuffer;
  readonly bytesPerIndex: bigint;
  readonly count: bigint;
  readonly indexCountPerPrimitive: bigint;
  readonly primitiveType: bigint;
}
