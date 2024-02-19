import { Injectable } from '@angular/core';

import {
  $ObjectsMap,
  Float4,
  Float4x4,
  IArchivedInstance,
  IArchivedPList,
  KeyedUnarchiver,
  NSArrayCoder,
  NSDateCoder,
  NSUUIDCoder,
} from '@skgrush/bplist-and-nskeyedunarchiver/NSKeyedUnarchiver';
import { deStructWithIter, Reader } from '@skgrush/bplist-and-nskeyedunarchiver/bplist';
import { BufferAttribute, BufferGeometry, Group, Material, Mesh, MeshBasicMaterial } from 'three';
import { float4x4ToMatrix4 } from '../functions/float4x4-to-matrix4';
import type { TransportProgressHandler } from '../models/transport-progress-handler';
import { UploadFileModel } from '../models/upload-file-model';
import type {
  CSMeshGeometryElement,
  CSMeshGeometrySource,
  CSMeshSlice,
  CSMeshSnapshot,
  ScanFile,
  SurveyLine,
  SurveyStation,
} from '../types/cavern-seer-scan';
import { buildLeveledLogger, LogLevel } from '@skgrush/bplist-and-nskeyedunarchiver/shared';

export enum MTLVertexFormat {
  float3 = 30,
}

@Injectable({
  // necessary to be providedIn:root for dynamic injection
  providedIn: 'root'
})
export class CavernSeerOpenerService {

  async decode(file: UploadFileModel, progress?: TransportProgressHandler): Promise<ScanFile> {
    return this.#parseBPListToScanFile(file, progress);
  }

  generateGroup(scanFile: ScanFile): Group {
    const material = new MeshBasicMaterial({ color: 0xFF0000 });

    const meshAnchors = scanFile.meshAnchors.map(slice => this.#meshSliceToGroup(slice, material));

    if (!meshAnchors.length) {
      debugger;
      console.warn('ScanFile', scanFile.name, ' contains no meshes; this is probably from a corrupted scan');
    }

    const group = new Group();
    group.add(...meshAnchors);
    group.name = scanFile.name;
    group.userData['cs:timestamp'] = scanFile.timestamp;
    group.userData['cs:encodingVersion'] = Number(scanFile.encodingVersion);
    group.matrixWorldNeedsUpdate = true;

    return group;
  }

  #meshSliceToGroup(slice: CSMeshSlice, mat: Material) {
    const geometry = new BufferGeometry();

    geometry.setIndex([...this.#meshGeometryElementToComponents(slice.faces)]);
    geometry.setAttribute('normal', this.#meshGeometrySourceToFloatBufferAttribute(slice.normals));
    geometry.setAttribute('position', this.#meshGeometrySourceToFloatBufferAttribute(slice.vertices));

    const mesh = new Mesh(geometry, mat);
    mesh.userData['cs:slice'] = true;
    mesh.name = slice.identifier.toString();
    const transform = float4x4ToMatrix4(slice.transform);
    mesh.applyMatrix4(transform)
    mesh.matrixWorldNeedsUpdate = true;

    return mesh;
  }

  #meshGeometrySourceToFloatBufferAttribute(src: CSMeshGeometrySource) {
    const bitsPerComponent = 8 * Number(src.bytesPerComponent);
    if (Number(src.format) !== MTLVertexFormat.float3) {
      throw new Error(`CSMeshGeometrySource for vertices has incorrect format: MTLVertexFormat[${src.format}]`);
    }
    if (src.componentsPerVector !== 3n) {
      throw new Error(`CSMeshGeometrySource for vertices expects 3 componentsPerVector, got ${src.componentsPerVector}`);
    }
    if (bitsPerComponent !== 32 && bitsPerComponent !== 64) {
      throw new Error(`bad bits: ${bitsPerComponent}`);
    }

    return new BufferAttribute(this.#readDataToFloatArray(bitsPerComponent, src.data, src), 3);
  }

  #meshGeometryElementToComponents(src: CSMeshGeometryElement) {
    const bytesPerComponent = Number(src.bytesPerIndex);
    const componentCount = Number(src.count * src.indexCountPerPrimitive);

    if (src.primitiveType !== 0n || src.indexCountPerPrimitive !== 3n) {
      throw new Error(`CSMeshGeometryElement primitiveType should be 0 for triangles, got ${src.primitiveType}`);
    }
    if (bytesPerComponent !== 4/* && bytesPerComponent !== 8*/) {
      throw new Error(`bad bits: ${bytesPerComponent}`);
    }

    const view = new DataView(src.data);

    const fn = (view: DataView, byteOffset: number) => ({ value: view.getInt32(byteOffset, true), bytesRead: bytesPerComponent });
    function* elementIndexIter() {
      for (let i = 0; i < componentCount; ++i) {
        yield fn;
      }
    }

    return deStructWithIter(elementIndexIter(), new DataView(src.data));
  }

  #readDataToFloatArray(bitsPerComponent: 32 | 64, data: ArrayBuffer, src: CSMeshGeometrySource) {
    const elementCount = Number(src.count * src.componentsPerVector);

    const deStructor = bitsPerComponent === 32
      ? (view: DataView, byteOffset: number) => ({ value: view.getFloat32(byteOffset, true), bytesRead: 4 })
      : (view: DataView, byteOffset: number) => ({ value: view.getFloat64(byteOffset, true), bytesRead: 8 });
    function* elementIndexIter() {
      for (let i = 0; i < elementCount; ++i) {
        yield deStructor;
      }
    }

    if (src.bytesPerComponent !== 4n || src.componentsPerVector !== 3n || src.offset !== 0n || src.stride !== 12n) {
      debugger;
    }

    const rawElementIter = deStructWithIter(elementIndexIter(), new DataView(data));

    const result = bitsPerComponent === 32
      ? new Float32Array(rawElementIter)
      : new Float64Array(rawElementIter);

    return result;
  }

  async #parseBPListToScanFile(file: UploadFileModel, progress?: TransportProgressHandler) {
    const archivedPlist = await this.#readTopObjectFromBPList(file);

    progress?.setLoadPercent(60, 'Converting top-level object into ScanFile...');
    return ScanFileCoder.unarchiveObject(ScanFileCoder, archivedPlist);
  }

  async #readTopObjectFromBPList(file: UploadFileModel, progress?: TransportProgressHandler) {
    const reader = await this.#readBPList(file);

    progress?.setLoadPercent(40, 'Converting unarchived-bplist into top-level object...');
    const result = reader.buildTopLevelObject();
    if (!result || typeof result !== 'object' || !('$archiver' in result)) {
      throw new Error('Invalid cavernseerscan file');
    }

    return result as IArchivedPList;
  }

  async #readBPList(file: UploadFileModel, progress?: TransportProgressHandler) {
    progress?.setLoadPercent(10, 'Reading binary blob...');
    const arrayBuffer = await file.blob.arrayBuffer();

    progress?.setLoadPercent(20, 'Converting blob into unarchived-bplist...');
    return new Reader(arrayBuffer, buildLeveledLogger({
      logger: console,
      level: LogLevel.warn,
    }));
  }
}

/**
 * Port of coder for CavernSeer's ScanFile.
 *
 * @link https://github.com/skgrush/CavernSeer/blob/e966eb/CavernSeer/Models/Serializations/ScanFile.swift
 */
class ScanFileCoder extends KeyedUnarchiver<ScanFile> {

  static readonly $classname = 'CavernSeer.ScanFile';

  constructor(
    readonly $objects: $ObjectsMap,
    readonly data: IArchivedInstance,
  ) {
    super();
  }

  static initForReadingDataFrom($objects: $ObjectsMap, data: IArchivedInstance) {
    return new ScanFileCoder($objects, data);
  }

  decode(): ScanFile {
    const version = this.containsValue('version')
      ? this.decodeInt32('version')
      : 1n;

    if (version === 1n) {
      throw new Error('Unfortunately cavernseerscan version 1 files are unsupported 😔. Upgrade your file in CavernSeer to version 2 first.');
    }
    if (version > 2n) {
      throw new Error(`Unknown cavernseerscan version ${version}`);
    }

    const timestamp = this.decodeObjectOf(NSDateCoder, 'timestamp', true);
    const name = this.decodeString('name', true);
    const center = CavernSeerCustomDecoders.decodeFloat3(this, 'center');
    const extent = CavernSeerCustomDecoders.decodeFloat3(this, 'extent');
    const meshAnchors = this.decodeObjectOf([NSArrayCoder, CSMeshSliceCoder], 'meshAnchors', true) as CSMeshSlice[];
    const startSnapshot = this.decodeSnapshot('startSnapshot');
    const endSnapshot = this.decodeSnapshot('endSnapshot');
    const stations = this.decodeObjectOf([NSArrayCoder, SurveyStationCoder], 'stations') as SurveyStation[] ?? [];
    const lines = this.decodeObjectOf([NSArrayCoder, SurveyLineCoder], 'lines') as SurveyLine[] ?? [];
    const location = null;

    return {
      encodingVersion: version,
      timestamp,
      name,
      center,
      extent,
      meshAnchors,
      startSnapshot,
      endSnapshot,
      stations,
      lines,
      // location,
    }
  }

  private decodeSnapshot(key: string): CSMeshSnapshot | null {
    if (!this.containsValue(key)) {
      return null;
    }

    // assumes version === 2
    return this.decodeObjectOf(CSMeshSnapshotCoder, key);
  }
}

/**
 * Port of coder for CavernSeer's CSMeshSlice.
 *
 * @link https://github.com/skgrush/CavernSeer/blob/e966eb/CavernSeer/Models/Serializations/CSMeshSlice.swift
 */
class CSMeshSliceCoder extends KeyedUnarchiver<CSMeshSlice> {

  static readonly $classname = 'CavernSeer.CSMeshSlice';

  constructor(
    readonly $objects: $ObjectsMap,
    readonly data: IArchivedInstance,
  ) {
    super();
  }

  static initForReadingDataFrom($objects: $ObjectsMap, data: IArchivedInstance) {
    return new CSMeshSliceCoder($objects, data);
  }

  decode(): CSMeshSlice {
    return {
      identifier: this.decodeObjectOf(NSUUIDCoder, 'identifier', true),
      transform: CavernSeerCustomDecoders.decodeFloat4x4(this, 'transform'),
      vertices: this.decodeObjectOf(CSMeshGeometrySourceCoder, 'vertices', true),
      faces: this.decodeObjectOf(CSMeshGeometryElementCoder, 'faces', true),
      normals: this.decodeObjectOf(CSMeshGeometrySourceCoder, 'normals', true),
    };
  }
}

/**
 * Port of coder for CavernSeer's CSMeshSnapshot.
 *
 * @link https://github.com/skgrush/CavernSeer/blob/e966eb/CavernSeer/Models/Serializations/CSMeshSnapshot.swift
 */
class CSMeshSnapshotCoder extends KeyedUnarchiver<CSMeshSnapshot> {

  static readonly $classname = 'CavernSeer.CSMeshSnapshot';

  constructor(
    readonly $objects: $ObjectsMap,
    readonly data: IArchivedInstance,
  ) {
    super();
  }

  static initForReadingDataFrom($objects: $ObjectsMap, data: IArchivedInstance) {
    return new CSMeshSnapshotCoder($objects, data);
  }

  decode(): CSMeshSnapshot {
    return {
      imageData: this.decodeBytes('imageData', true),
      transform: CavernSeerCustomDecoders.decodeFloat4x4(this, 'transform'),
      identifier: this.decodeObjectOf(NSUUIDCoder, 'identifier', true),
      name: this.decodeObject('name'),
    };
  }
}

/**
 * Port of coder for CavernSeer's SurveyLine.
 *
 * @link https://github.com/skgrush/CavernSeer/blob/e966eb/CavernSeer/Models/Serializations/SurveyLine.swift
 */
class SurveyLineCoder extends KeyedUnarchiver<SurveyLine> {

  static readonly $classname = 'CavernSeer.SurveyLine';

  constructor(
    readonly $objects: $ObjectsMap,
    readonly data: IArchivedInstance,
  ) {
    super();
  }

  static initForReadingDataFrom($objects: $ObjectsMap, data: IArchivedInstance) {
    return new SurveyLineCoder($objects, data);
  }

  decode(): SurveyLine {
    return {
      startIdentifier: this.decodeObjectOf(NSUUIDCoder, 'startIdentifier', true),
      endIdentifier: this.decodeObjectOf(NSUUIDCoder, 'endIdentifier', true),
    }
  }
}

/**
 * Port of coder for CavernSeer's SurveyStation.
 *
 * @link https://github.com/skgrush/CavernSeer/blob/e966eb/CavernSeer/Models/Serializations/SurveyStation.swift
 */
class SurveyStationCoder extends KeyedUnarchiver<SurveyStation> {

  static readonly $classname = 'CavernSeer.SurveyStation';

  constructor(
    readonly $objects: $ObjectsMap,
    readonly data: IArchivedInstance,
  ) {
    super();
  }

  static initForReadingDataFrom($objects: $ObjectsMap, data: IArchivedInstance) {
    return new SurveyStationCoder($objects, data);
  }

  decode(): SurveyStation {
    return {
      identifier: this.decodeObjectOf(NSUUIDCoder, 'identifier', true),
      transform: CavernSeerCustomDecoders.decodeFloat4x4(this, 'transform'),
      name: this.decodeObject('name'),
    }
  }
}

/**
 * Port of coder for CavernSeer's CSMeshGeometrySource.
 *
 * @link https://github.com/skgrush/CavernSeer/blob/e966eb/CavernSeer/Models/Serializations/CSMeshSlice.swift#L73
 */
class CSMeshGeometrySourceCoder extends KeyedUnarchiver<CSMeshGeometrySource> {

  static readonly $classname = 'CavernSeer.CSMeshGeometrySource';

  constructor(
    readonly $objects: $ObjectsMap,
    readonly data: IArchivedInstance,
  ) {
    super();
  }

  static initForReadingDataFrom($objects: $ObjectsMap, data: IArchivedInstance) {
    return new CSMeshGeometrySourceCoder($objects, data);
  }

  decode(): CSMeshGeometrySource {
    return {
      bytesPerComponent: this.decodeInt32('bytesPerComponent'),
      componentsPerVector: this.decodeInt32('componentsPerVector'),
      count: this.decodeInt64('count'),
      offset: this.decodeInt64('offset'),
      stride: this.decodeInt64('stride'),
      format: this.decodeInt64('format'),
      data: this.decodeBytes('data', true),
      semantic: this.decodeObject('semantic'),
    };
  }
}

/**
 * Port of coder for CavernSeer's CSMeshGeometryElement.
 *
 * @link https://github.com/skgrush/CavernSeer/blob/e966eb/CavernSeer/Models/Serializations/CSMeshSlice.swift#L171
 */
class CSMeshGeometryElementCoder extends KeyedUnarchiver<CSMeshGeometryElement> {

  static readonly $classname = 'CavernSeer.CSMeshGeometryElement';

  constructor(
    readonly $objects: $ObjectsMap,
    readonly data: IArchivedInstance,
  ) {
    super();
  }

  static initForReadingDataFrom($objects: $ObjectsMap, data: IArchivedInstance) {
    return new CSMeshGeometryElementCoder($objects, data);
  }

  decode(): CSMeshGeometryElement {
    return {
      data: this.decodeBytes('data', true),
      primitiveType: this.decodeInt32('primitiveType'),
      bytesPerIndex: this.decodeInt32('bytesPerIndex'),
      count: this.decodeInt32('count'),
      indexCountPerPrimitive: this.decodeInt32('indexCountPerPrimitive'),
    };
  }
}

/**
 * Mirror of CavernSeer's `NSCoder+simd.swift` implementation.
 *
 * Janky coder extensions I implemented before I knew that there were official simd coders.
 *
 * @link https://github.com/skgrush/CavernSeer/blob/e966eb/CavernSeer/extensions/NSCoder%2Bsimd.swift
 */
abstract class CavernSeerCustomDecoders {
  static decodeFloat3(coder: KeyedUnarchiver<any>, prefix: string) {
    const x = coder.decodeFloat(`${prefix}_x`);
    const y = coder.decodeFloat(`${prefix}_y`);
    const z = coder.decodeFloat(`${prefix}_z`);

    return [x, y, z] as const;
  }

  static decodeFloat4(coder: KeyedUnarchiver<any>, prefix: string): Float4 {
    const x = coder.decodeFloat(`${prefix}_x`);
    const y = coder.decodeFloat(`${prefix}_y`);
    const z = coder.decodeFloat(`${prefix}_z`);
    const w = coder.decodeFloat(`${prefix}_w`);
    return [x, y, z, w];
  }

  static decodeFloat4x4(coder: KeyedUnarchiver<any>, prefix: string): Float4x4 {
    const col0 = CavernSeerCustomDecoders.decodeFloat4(coder, `${prefix}_0`);
    const col1 = CavernSeerCustomDecoders.decodeFloat4(coder, `${prefix}_1`);
    const col2 = CavernSeerCustomDecoders.decodeFloat4(coder, `${prefix}_2`);
    const col3 = CavernSeerCustomDecoders.decodeFloat4(coder, `${prefix}_3`);

    return [col0, col1, col2, col3];
  }
}
