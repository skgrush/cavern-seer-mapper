import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { defer, first, map, Observable, of, switchMap, take, tap, timer } from 'rxjs';
import { ModelManagerService } from './model-manager.service';
import { ModelLoadService } from './model-load.service';
import { TransportProgressHandler } from '../models/transport-progress-handler';
import { CanvasService } from './canvas.service';
import { Camera, Object3D } from 'three';
import { ignoreNullish } from '../operators/ignore-nullish';
import { CompressionService } from './compression.service';
import { MaterialManagerService } from './materials/material-manager.service';

export enum ModelExporterNames {
  OBJ = 'OBJ',
  GLTF = 'GLTF',
  GLB = 'GLB',
  PLY = 'PLY',
  PLYAscii = 'PLYAscii',
  STL = 'STL',
  STLAscii = 'STLAscii',
  USDZ = 'USDZ',
}

export const modelExporterAsciis = new Set([
  ModelExporterNames.OBJ,
  ModelExporterNames.GLTF,
  ModelExporterNames.PLYAscii,
  ModelExporterNames.STLAscii,
] as const);

const modelExporterExtensions = {
  OBJ: ['obj', 'model/obj'],
  GLTF: ['gltf', 'model/gltf+json'],
  GLB: ['glb', 'model/gltf-binary'],
  PLY: ['ply', 'text/plain'],
  PLYAscii: ['ply', 'text/plain'],
  STL: ['stl', 'model/x.stl-binary'],
  STLAscii: ['stl', 'model/x.stl-ascii'],
  USDZ: ['usdz', 'model/vnd.usdz+zip'],
} as const satisfies Record<ModelExporterNames, readonly [ext: string, mime: string]>;

type ModelExporterReturnMap = {
  OBJ: string,
  GLTF: string,
  GLB: ArrayBuffer,
  PLY: ArrayBuffer | null,
  PLYAscii: string | null,
  STL: DataView,
  STLAscii: string,
  USDZ: Uint8Array,
};

@Injectable()
export class ExportService {

  readonly #document = inject(DOCUMENT);
  readonly #modelManager = inject(ModelManagerService);
  readonly #modelLoad = inject(ModelLoadService);
  readonly #canvasService = inject(CanvasService);
  readonly #compressionService = inject(CompressionService);
  readonly #materialManager = inject(MaterialManagerService);

  readonly #gltfModule = defer(() => import('three/examples/jsm/exporters/GLTFExporter.js'));
  readonly #plyModule = defer(() => import('three/examples/jsm/exporters/PLYExporter.js'));
  readonly #stlModule = defer(() => import('three/examples/jsm/exporters/STLExporter.js'));

  readonly #parsers = {
    OBJ: (model: Object3D) => defer(() => import('three/examples/jsm/exporters/OBJExporter.js')).pipe(
      map(({ OBJExporter }) => new OBJExporter().parse(model)),
    ),
    GLTF: (model: Object3D) => this.#gltfModule.pipe(
      switchMap(({ GLTFExporter }) => new GLTFExporter().parseAsync(model, { binary: false })),
      map(result => JSON.stringify(result)),
    ),
    GLB: (model: Object3D) => this.#gltfModule.pipe(
      switchMap(({ GLTFExporter }) => new GLTFExporter().parseAsync(model, { binary: true }) as Promise<ArrayBuffer>),
    ),
    PLY: (model: Object3D) => this.#plyModule.pipe(
      map(({ PLYExporter }) =>
        new PLYExporter().parse(model, () => {}, { binary: true, littleEndian: true }),
      ),
    ),
    PLYAscii: (model: Object3D) => this.#plyModule.pipe(
      map(({ PLYExporter }) =>
        new PLYExporter().parse(model, () => {}, { binary: false, littleEndian: true }),
      ),
    ),
    STL: (model: Object3D) => this.#stlModule.pipe(
      map(({ STLExporter }) => new STLExporter().parse(model, { binary: true })),
    ),
    STLAscii: (model: Object3D) => this.#stlModule.pipe(
      map(({ STLExporter }) => new STLExporter().parse(model, { binary: false })),
    ),
    USDZ: (model: Object3D) => defer(() => import('three/examples/jsm/exporters/USDZExporter.js')).pipe(
      switchMap(({ USDZExporter }) => new USDZExporter().parse(model, {quickLookCompatible: true})),
    ),
  } satisfies Record<ModelExporterNames, (model: Object3D) => any>;

  /**
   * Trigger a browser download of the currentOpenGroup.
   *
   * @returns Observable of a descriptive object on success or undefined if there is no group.
   *  The observable will raise any errors during the zip process.
   */
  downloadCurrentModelZip$(
    compressionLevel: number,
    fileName: string | null,
    progress: TransportProgressHandler,
  ) {
    return this.#modelManager.currentOpenGroup$.pipe(
      first(),
      switchMap(currentGroup => {
        if (!currentGroup) {
          return of(undefined);
        }

        return this.#modelLoad.writeGroupToZip$(
          currentGroup,
          compressionLevel,
          progress,
        ).pipe(
          map(blob => ({ blob, currentGroup }))
        );
      }),
      switchMap(info => {
        if (!info) {
          return of(info);
        }
        const { blob, currentGroup } = info;
        const name = this.normalizeName(fileName, currentGroup.identifier, '.zip');

        return this.downloadBlob$(name, blob);
      }),
    )
  }

  downloadCanvasImage$(
    baseName: string,
    ext: 'png' | 'jpeg' | 'webp',
    rendererSymbol?: symbol,
    camera?: Camera,
    sizeMultiplier?: number,
    quality?: number,
  ) {
    const type = `image/${ext}` as const;
    return defer(() => this.#canvasService.exportToImage(type, rendererSymbol, camera, sizeMultiplier, quality)).pipe(
      switchMap(blob => {
        if (blob.type && blob.type !== type) {
          console.info('Seems browser does not support', ext, '; defaulting...');
          ext = blob.type.slice(6) as typeof ext;
        }
        const name = this.normalizeName(null, baseName, `.${ext}`);
        return this.downloadBlob$(name, blob);
      }),
    );
  }

  downloadCanvasSvg$(
    baseName: string,
    rendererSymbol?: symbol,
    camera?: Camera,
  ) {
    return defer(() => {
      const { blob, renderInfo } = this.#canvasService.exportToSvg(rendererSymbol, camera);

      const name = this.normalizeName(null, baseName, '.svg');
      const size = blob.size;
      console.info('Download SVG context:', { name, size, renderInfo });

      return this.downloadBlob$(name, blob);
    });
  }

  downloadBlob$(filename: string, blob: Blob) {
    return defer(() => {
      const url = URL.createObjectURL(blob);

      const anchor = this.#document.createElement('a');
      anchor.href = url;
      anchor.download = filename;

      anchor.click();

      return timer(10).pipe(
        tap(() => URL.revokeObjectURL(url)),
        map(() => ({ name: filename, size: blob.size })),
      );
    });
  }

  exportModel$<T extends ModelExporterNames>(type: T) {
    const meshSub = this.#materialManager.temporarilySwitchMaterial$('standard').subscribe();
    const fn = this.#parsers[type] as (o: Object3D) => Observable<ModelExporterReturnMap[T]>;
    return this.#modelManager.currentOpenGroup$.pipe(
      ignoreNullish(),
      take(1),
      switchMap(currentGroup => currentGroup.encode(fn)),
      tap({
        finalize: () => meshSub.unsubscribe(),
      }),
    );
  }

  downloadModel$<T extends ModelExporterNames>(baseName: string, type: T, gzipCompress: boolean) {
    const [ext, mime] = modelExporterExtensions[type];

    const name = this.normalizeName(null, baseName, `.${ext}`);

    return this.exportModel$(type).pipe(
      switchMap(result => {
        if (result === null) {
          throw new Error(`Got null exporting ${baseName} to ${type}`);
        }
        const blob = new Blob([result], { type: mime });

        if (gzipCompress) {
          const compressedName = `${name}.gz`;
          return this.#compressionService.compressOrDecompressBlob$(true, blob, 'gzip').pipe(
            switchMap(compressedBlob => this.downloadBlob$(compressedName, compressedBlob)),
          );
        } else {
          return this.downloadBlob$(name, blob);
        }
      }),
    );
  }

  normalizeName(inputName: string | null, groupIdentifier: string, extension: `.${string}`) {
    // if inputName is falsy, use groupIdentifier
    const name = inputName || groupIdentifier;

    if (name.toLowerCase().endsWith(extension)) {
      return name;
    }
    return `${name}${extension}`;
  }
}
