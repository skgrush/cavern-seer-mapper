import { Injectable, Injector, inject } from '@angular/core';
import { Observable, catchError, defer, first, firstValueFrom, forkJoin, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Group } from 'three';
import { BaseModelManifest, ModelManifestV0, modelManifestParse } from '../models/model-manifest';
import { FileModelType } from '../models/model-type.enum';
import { AnyRenderModel } from '../models/render/any-render-model';
import { BaseRenderModel } from '../models/render/base.render-model';
import { CavernSeerScanRenderModel, IScanFileParsed } from '../models/render/cavern-seer-scan.render-model';
import { GltfRenderModel } from '../models/render/gltf.render-model';
import { GroupRenderModel } from '../models/render/group.render-model';
import { ObjRenderModel } from '../models/render/obj.render-model';
import { UnknownRenderModel } from '../models/render/unknown.render-model';
import { TransportProgressHandler } from '../models/transport-progress-handler';
import { UploadFileModel } from '../models/upload-file-model';
import { ignoreNullishArray } from '../operators/ignore-nullish';
import { AnnotationBuilderService } from './annotation-builder.service';
import { FileTypeService } from './file-type.service';
import type { IUnzipDirEntry, IUnzipEntry, IZipEntry } from './zip.service';

type IModelLoadResult<T extends BaseRenderModel<any>> = {
  result?: T;
  errors: Error[];
}

@Injectable()
export class ModelLoadService {

  readonly #annotationBuilder = inject(AnnotationBuilderService);
  readonly #fileTypeService = inject(FileTypeService);
  readonly #injector = inject(Injector);

  readonly #objLoader$ = defer(() =>
    import('three/examples/jsm/loaders/OBJLoader.js')
  ).pipe(
    map(({ OBJLoader }) => OBJLoader),
    shareReplay(1),
  );

  readonly #gltfLoader$ = defer(() =>
    import('three/examples/jsm/loaders/GLTFLoader.js')
  ).pipe(
    map(({ GLTFLoader }) => GLTFLoader),
    shareReplay(1),
  );

  readonly #zipService$ = defer(() =>
    import('./zip.service')
  ).pipe(
    map(({ ZipService }) => this.#injector.get(ZipService)),
    shareReplay(1),
  );

  readonly #cavernSeerOpenerService$ = defer(() =>
    import('./cavern-seer-opener.service')
  ).pipe(
    map(({ CavernSeerOpenerService }) => this.#injector.get(CavernSeerOpenerService)),
    shareReplay(1),
  );

  exportModelForSerializing(model: BaseRenderModel<any>): Observable<null | Blob> {
    return of(model.serialize());
  }

  loadFile(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
  ): Observable<IModelLoadResult<AnyRenderModel>> {
    return defer(() => {
      switch (file.type) {

        case FileModelType.obj:
          return this.loadObj(file, progress);

        case FileModelType.gLTF:
          return this.loadGltf(file, progress);

        case FileModelType.group:
          return this.loadGroup(file, progress);

        case FileModelType.cavernseerscan:
          return this.loadCavernSeerFile(file, progress);

        default:
          return of({
            result: UnknownRenderModel.fromUploadModel(file),
            errors: [],
          });
      }
    }).pipe(tap({
      next: v => console.info('loadFile.next', v),
      complete: () => console.info('loadFile.complete'),
      error: e => console.error('loadFile.error', e),
    }));
  }

  loadObj(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
  ): Observable<IModelLoadResult<ObjRenderModel>> {
    return defer(() => file.blob.text()).pipe(
      tap(() => progress?.addToLoadedCount(file.blob.size)),
      switchMap(rawJson => this.#rawLoadObj(rawJson)),
      map(group => ({
        errors: [],
        result: ObjRenderModel.fromUploadModel(file, group),
      })),
      catchError(err => of({
        errors: [err],
      })),
    );
  }

  #rawLoadObj(
    rawJson: string,
    progress?: TransportProgressHandler,
  ): Observable<Group> {
    return this.#objLoader$.pipe(
      map(cls => new cls()),
      map(loader => loader.parse(rawJson)),
    )
  }

  loadGltf(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
  ): Observable<IModelLoadResult<GltfRenderModel>> {
    return defer(() => file.blob.arrayBuffer()).pipe(
      tap(() => progress?.addToLoadedCount(file.blob.size)),
      switchMap(buffer => this.#rawLoadGltf(buffer)),
      map(result => ({
        errors: [],
        result: result ? GltfRenderModel.fromUploadModel(file, result) : undefined,
      })),
      catchError(err => of({
        errors: [err],
      })),
    );
  }

  #rawLoadGltf(
    arrayBuffer: ArrayBuffer,
    progress?: TransportProgressHandler,
  ) {
    return this.#gltfLoader$.pipe(
      map(cls => new cls()),
      switchMap(loader => loader.parseAsync(arrayBuffer, '')),
    );
  }

  loadCavernSeerFile(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
  ): Observable<IModelLoadResult<CavernSeerScanRenderModel>> {
    if (!this.#fileTypeService.isCavernSeerScan(file.mime, file.identifier)) {
      return throwError(() => new Error(`loadCavernSeerFile doesn't support file ${file.type} of ${file.identifier}`));
    }

    return this.#cavernSeerOpenerService$.pipe(
      switchMap(opener => {
        return defer(() => opener.decode(file, progress)).pipe(
          map((scanFile): IScanFileParsed => ({
            encodingVersion: scanFile.encodingVersion,
            timestamp: scanFile.timestamp,
            name: scanFile.name,
            startSnapshot: scanFile.startSnapshot,
            endSnapshot: scanFile.endSnapshot,
            group: opener.generateGroup(scanFile),
            stations: scanFile.stations,
            lines: scanFile.lines,

          })),
          map(scanFileParsed => CavernSeerScanRenderModel.fromUploadModelAndParsedScanFile(file, scanFileParsed)),
          map(model => ({
            errors: [],
            result: model,
          })),
        );
      }),
    );
  }

  loadGroup(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
  ): Observable<IModelLoadResult<GroupRenderModel>> {
    if (this.#fileTypeService.isZip(file.mime, file.identifier)) {
      return this.#zipService$.pipe(
        tap(() => progress?.setLoadedCount(0, `Unzipping...`)),
        switchMap(zs => zs.unzip$(file)),
        tap(() => progress?.setLoadedCount(0, `Unzipped! Preparing models...`)),
        switchMap(({ file, ...dirEntry }) => this.#readAndRemoveManifest$(dirEntry)),
        switchMap(({ dirEntry, manifest }) => this.#loadZipEntriesRecursively$(dirEntry, manifest, progress)),
        map(({ result, errors }): IModelLoadResult<GroupRenderModel> => ({
          errors,
          result: result as GroupRenderModel,
        })),
        tap(compl => console.info('group complete')),
      )
    }

    return throwError(() => new Error(`loadGroup doesn't support file ${file.type} of ${file.identifier}`));
  }

  writeGroupToZip$(
    group: GroupRenderModel,
    compressionLevel: number,
    progress: TransportProgressHandler,
  ) {
    const fileComment = null;

    const manifest = ModelManifestV0.fromModel(group);
    const manifestEntry: IZipEntry = {
      data: manifest.serialize(),
      comment: null,
      path: this.#fileTypeService.manifestFileName,
    };

    const entriesGenerator = this.#recursivelyExportModelZipEntries(
      group,
      ''
    );
    async function* fullGenerator() {
      yield manifestEntry;
      yield* entriesGenerator;
    }

    return this.#zipService$.pipe(
      first(),
      switchMap(zipService => zipService.zip$({
        generator: fullGenerator(),
        fileComment,
        compressionLevel,
        progress,
      })),
    );
  }

  async *#recursivelyExportModelZipEntries(
    entry: GroupRenderModel,
    parentPath: string,
  ): AsyncGenerator<IZipEntry> {
    console.assert(!parentPath || parentPath.endsWith('/'), 'whoops, parentPath should be empty or slash-suffixed!');
    for (const child of entry.children) {
      const path = `${parentPath}${child.identifier}`;
      const data = await firstValueFrom(this.exportModelForSerializing(child));
      if (data !== null) {
        yield {
          path,
          comment: null,
          data,
        };
      }

      if (child instanceof GroupRenderModel) {
        yield* this.#recursivelyExportModelZipEntries(
          child,
          path,
        );
      }
    }
  }

  #loadZipEntriesRecursively$(
    unzipEntry: IUnzipEntry,
    manifest?: BaseModelManifest,
    progress?: TransportProgressHandler,
  ): Observable<IModelLoadResult<AnyRenderModel>> {
    return defer((): Observable<IModelLoadResult<AnyRenderModel>> => {
      if (unzipEntry.dir) {
        // entry is a directory
        if (unzipEntry.children.length === 0) {
          // entry is an *empty* directory
          return of({
            result: GroupRenderModel.fromModels(unzipEntry.name, []),
            errors: [],
          });
        }

        // entry is a directory with entries
        return forkJoin(
          unzipEntry.children.map(child => this.#loadZipEntriesRecursively$(child, manifest, progress)),
        ).pipe(
          map((results): IModelLoadResult<GroupRenderModel> => {
            const models = results.map(r => r.result).filter(ignoreNullishArray);
            return {
              errors: results.flatMap(r => r.errors),
              result: GroupRenderModel.fromModels(unzipEntry.name, models),
            };
          }),
        );
      }

      // file is not a directory
      return defer(() => unzipEntry.loader()).pipe(
        switchMap(blob =>
          this.loadFile(
            UploadFileModel.fromUnzip(
              unzipEntry,
              blob,
              this.#fileTypeService.getType(blob.type, unzipEntry.name),
            ),
            progress
          ),
        ),
      );
    }).pipe(
      catchError(err => of({
        errors: [err],
        result: undefined,
      })),
      map((result: IModelLoadResult<AnyRenderModel>) => {
        if (manifest && result.result) {
          result.errors.push(...result.result.setFromManifest(manifest, unzipEntry.path, this.#annotationBuilder));
        }

        return result;
      }),
    )
  }

  #readAndRemoveManifest$(dirEntry: IUnzipDirEntry): Observable<{ dirEntry: IUnzipDirEntry, manifest?: BaseModelManifest }> {
    const fallback$ = () => of({ dirEntry });

    const manifestIdx = dirEntry.children.findIndex(entry => entry.name === this.#fileTypeService.manifestFileName);
    if (manifestIdx === -1) {
      return fallback$();
    }

    const newChildren = dirEntry.children.slice();
    const [manifestEntry] = newChildren.splice(manifestIdx, 1);

    if (manifestEntry.dir) {
      console.error('manifest file appears to be a directory?', manifestEntry);
      return fallback$();
    }

    return defer(() => manifestEntry.loader()).pipe(
      switchMap(jsonBlob => jsonBlob.text()),
      map(jsonString => modelManifestParse(jsonString)),
      map(manifest => ({
        manifest,
        dirEntry: {
          ...dirEntry,
          children: newChildren,
        },
      })),
    )
  }
}
