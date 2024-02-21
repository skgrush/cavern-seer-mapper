import { inject, Injectable, Injector } from '@angular/core';
import {
  catchError,
  defer,
  first,
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { LoadingManager } from 'three';
import { BaseModelManifest, modelManifestParse, ModelManifestV0 } from '../models/model-manifest';
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
import type { IUnzipDirEntry, IUnzipFileEntry, IZipEntry } from './zip.service';
import { WallsRenderModel } from '../models/render/walls.render-model';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { MtlRenderModel } from '../models/render/mtl.render-model';

type IModelLoadResult<T extends BaseRenderModel<any>> = {
  result?: T;
  errors: Error[];
}

function flattenModelLoadResults<T extends BaseRenderModel<any>>(results: IModelLoadResult<T>[]): {
  result: T[],
  errors: Error[]
} {
  return {
    result: results.map(r => r.result).filter(ignoreNullishArray),
    errors: results.flatMap(r => r.errors),
  };
}

function forkOrEmpty<T>(observables: Observable<T>[]) {
  if (observables.length) {
    return forkJoin(observables);
  }
  return of([]);
}

@Injectable()
export class ModelLoadService {

  readonly #annotationBuilder = inject(AnnotationBuilderService);
  readonly #fileTypeService = inject(FileTypeService);
  readonly #injector = inject(Injector);

  readonly #objLoader$ = defer(() =>
    import('three/examples/jsm/loaders/OBJLoader.js'),
  ).pipe(
    map(({OBJLoader}) => OBJLoader),
    shareReplay(1),
  );

  readonly #gltfLoader$ = defer(() =>
    import('three/examples/jsm/loaders/GLTFLoader.js'),
  ).pipe(
    map(({GLTFLoader}) => GLTFLoader),
    shareReplay(1),
  );

  readonly #zipService$ = defer(() =>
    import('./zip.service'),
  ).pipe(
    map(({ZipService}) => this.#injector.get(ZipService)),
    shareReplay(1),
  );

  readonly #cavernSeerOpenerService$ = defer(() =>
    import('./cavern-seer-opener.service'),
  ).pipe(
    map(({CavernSeerOpenerService}) => this.#injector.get(CavernSeerOpenerService)),
    shareReplay(1),
  );

  readonly #wallsOpener$ = defer(() =>
    import('../functions/primitiveWallsFileParse'),
  ).pipe(
    map(({primitiveWallsFileParse}) => primitiveWallsFileParse),
    shareReplay(1),
  );

  exportModelForSerializing(model: BaseRenderModel<any>): Observable<null | Blob> {
    return of(model.serialize());
  }

  loadFile(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
    parentDirectory?: UnzippedDirectoryOpener,
  ): Observable<IModelLoadResult<AnyRenderModel>> {
    return defer(() => {
      switch (file.type) {

        case FileModelType.obj:
          return this.loadObj(file, progress, parentDirectory);

        case FileModelType.gLTF:
          return this.loadGltf(file, progress, parentDirectory);

        case FileModelType.group:
          return this.loadGroup(file, progress);

        case FileModelType.cavernseerscan:
          return this.loadCavernSeerFile(file, progress);

        case FileModelType.walls:
          return this.loadWallsFile(file, progress);

        case FileModelType.mtl:
          return this.loadMtlFile(file, progress, parentDirectory);

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
    parentDirectory?: UnzippedDirectoryOpener,
  ): Observable<IModelLoadResult<ObjRenderModel>> {
    return defer(() => file.blob.text()).pipe(
      tap(() => progress?.addToLoadedCount(file.blob.size)),
      switchMap(rawJson => this.#rawLoadObj(rawJson, progress, parentDirectory)),
      map(({ group, hasCustomTexture }) => ({
        errors: [],
        result: ObjRenderModel.fromUploadModel(file, group, hasCustomTexture),
      })),
      catchError(err => of({
        errors: [err],
      })),
    );
  }

  #rawLoadObj(
    rawText: string,
    progress?: TransportProgressHandler,
    parentDirectory?: UnzippedDirectoryOpener,
  ) {
    return this.#objLoader$.pipe(
      map(cls => new cls()),
      switchMap(loader =>
        this.#findMtlLibInObj(rawText.slice(0, 500), parentDirectory).pipe(map(mtlModel => ({ mtlModel, loader }))),
      ),
      map(({ loader, mtlModel }) => {
        loader.manager = new ZipRelativeLoadingManager('some-obj', parentDirectory);
        if (mtlModel) {
          loader.setMaterials(mtlModel.materialCreator);
        }

        const group = loader.parse(rawText);
        return {
          group,
          hasCustomTexture: !!mtlModel,
        }
      }),
    );
  }

  loadGltf(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
    parentDirectory?: UnzippedDirectoryOpener,
  ): Observable<IModelLoadResult<GltfRenderModel>> {
    return defer(() => file.blob.arrayBuffer()).pipe(
      tap(() => progress?.addToLoadedCount(file.blob.size)),
      switchMap(buffer => this.#rawLoadGltf(buffer, progress, parentDirectory)),
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
    parentDirectory?: UnzippedDirectoryOpener,
  ) {
    return this.#gltfLoader$.pipe(
      map(cls => new cls()),
      switchMap(loader => {
        loader.manager = new ZipRelativeLoadingManager('some-gltf', parentDirectory);
        return loader.parseAsync(arrayBuffer, '');
      }),
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
        return defer(() =>
          opener.decode(file, progress),
        ).pipe(
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

  loadWallsFile(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
  ): Observable<IModelLoadResult<WallsRenderModel>> {
    if (!this.#fileTypeService.isVrmlFile(file.mime, file.identifier)) {
      return throwError(() => new Error(`loadWallsFile doesn't support file ${file.type} of ${file.identifier}`));
    }

    return defer(() =>
      file.blob.text(),
    ).pipe(
      switchMap(text =>
        this.#wallsOpener$.pipe(map(opener => opener(text))),
      ),
      map(opener => WallsRenderModel.fromUploadModelAndParsedScanFile(file, opener)),
      map(model => ({
        result: model,
        errors: [],
      })),
      catchError(err => of({
        errors: [err],
      })),
    );
  }

  loadMtlFile(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
    parentDirectory?: UnzippedDirectoryOpener,
  ): Observable<IModelLoadResult<MtlRenderModel>> {
    return defer(() =>
      file.blob.text(),
    ).pipe(
      map(text => {
        const loadingManager = new ZipRelativeLoadingManager(file.identifier, parentDirectory);
        const loader = new MTLLoader(loadingManager);
        const creator = loader.parse(text, '');

        return {
          errors: [],
          result: MtlRenderModel.fromUploadModel(
            file,
            creator,
          )
        };
      }),
      catchError(err => of({
        errors: [err],
      })),
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
        switchMap(({ dirEntry, manifest }) => {
          const dirOpener = new UnzippedDirectoryOpener(dirEntry, this, this.#fileTypeService);
            return this.#loadZipEntriesRecursively$(dirOpener, manifest, progress).pipe(
              map(model => ({ dirOpener, model })),
            );
          }
        ),
        map(({ dirOpener, model }): IModelLoadResult<GroupRenderModel> => ({
          errors: dirOpener.getErrorsRecursively(),
          result: model,
        })),
        tap(compl => console.info('group complete')),
      );
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
      '',
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

  /**
   * Recursively load IUnzipEntry to models.
   *
   * @private
   */
  #loadZipEntriesRecursively$(
    opener: UnzippedDirectoryOpener,
    manifest: BaseModelManifest | undefined,
    progress: TransportProgressHandler | undefined,
  ): Observable<GroupRenderModel>;
  #loadZipEntriesRecursively$(
    opener: UnzippedFileOpener | UnzippedDirectoryOpener,
    manifest: BaseModelManifest | undefined,
    progress: TransportProgressHandler | undefined,
  ): Observable<AnyRenderModel>;
  #loadZipEntriesRecursively$(
    opener: UnzippedFileOpener | UnzippedDirectoryOpener,
    manifest: BaseModelManifest | undefined,
    progress: TransportProgressHandler | undefined,
  ): Observable<AnyRenderModel> {
    return defer(() => {
      if (opener instanceof UnzippedFileOpener) {
        return opener.loadRenderModel$();
      }

      if (!opener.childOpeners.length) {
        return of(GroupRenderModel.fromUnzipDirEntry(opener.unzipEntry, []));
      }

      return forkJoin(
        opener.childOpeners.map(child => this.#loadZipEntriesRecursively$(child, manifest, progress)),
      ).pipe(
        map(models => GroupRenderModel.fromUnzipDirEntry(opener.unzipEntry, models))
      );
    }).pipe(
      map(result => {
        if (manifest) {
          const manifestError = result.setFromManifest(manifest, opener.unzipEntry.path, this.#annotationBuilder);
          opener.errors.push(...manifestError);
        }

        return result;
      }),
    );
  }

  #readAndRemoveManifest$(dirEntry: IUnzipDirEntry): Observable<{
    dirEntry: IUnzipDirEntry,
    manifest?: BaseModelManifest
  }> {
    const fallback$ = () => of({dirEntry});

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

    return defer(() => manifestEntry.blob.text()).pipe(
      map(jsonString => modelManifestParse(jsonString)),
      map(manifest => ({
        manifest,
        dirEntry: {
          ...dirEntry,
          children: newChildren,
        },
      })),
    );
  }

  #findMtlLibInObj(objText: string, parentDirectory?: UnzippedDirectoryOpener): Observable<MtlRenderModel | undefined> {
    const match = /^mtllib +(?:.\/|.\\)?(.*)$/m.exec(objText);
    const libName = match?.[1];
    if (!libName) {
      return of(undefined);
    }
    if (!parentDirectory) {
      console.warn('OBJ specified a mtllib', libName, 'but no sibling models were passed');
      return of(undefined);
    }
    const mtlModel = parentDirectory.childOpeners
      .filter((opener): opener is UnzippedFileOpener => !!opener.uploadFileModel)
      .find(opener =>
        opener.uploadFileModel.type === FileModelType.mtl &&
        opener.unzipEntry.name === libName
      );

    if (!mtlModel) {
      console.warn('OBJ specified a mtllib', libName, 'but no match was found');
      return of(undefined)
    }
    return mtlModel.loadRenderModel$().pipe(
      map(renderModel => {
        if (renderModel instanceof MtlRenderModel) {
          return renderModel;
        }
        throw new Error(`Weird case where #findMtlLibInObj() tried to load a non MTL render model?`);
      }),
    );
  }
}

/**
 * Lazy opener which allows opening files as-needed without re-opening.
 * Some logic like this is necessary to open files that reference other files.
 *
 * TODO: no support for TransportProgressHandler
 */
class UnzippedFileOpener implements IModelLoadResult<AnyRenderModel> {

  readonly uploadFileModel: UploadFileModel;
  result?: AnyRenderModel;
  errors: Error[] = [];

  constructor(
    readonly unzipEntry: IUnzipFileEntry,
    readonly parent: UnzippedDirectoryOpener,
  ) {
    this.uploadFileModel = UploadFileModel.fromUnzip(
      unzipEntry,
      parent.fileTypeService.getType(unzipEntry.blob.type, unzipEntry.name),
    );
  }

  public loadRenderModel$(): Observable<AnyRenderModel> {
    return defer(() => {
      if (this.result) {
        return of(this.result);
      }
      return this._loadRenderModel$();
    });
  }

  private _loadRenderModel$() {
    return defer(() =>
      this.parent.modelLoadService.loadFile(
        this.uploadFileModel,
        undefined,
        this.parent,
      ),
    ).pipe(
      catchError(err => of({ errors: [err], result: undefined })),
      map(result => {
        this.errors.push(...result.errors);
        if (result.result) {
          this.result = result.result;
        } else {
          this.result = UnknownRenderModel.fromUploadModel(this.uploadFileModel);
        }
        return this.result;
      }),
    );
  }
}

class UnzippedDirectoryOpener {

  readonly childOpeners: Array<UnzippedFileOpener | UnzippedDirectoryOpener> = [];
  readonly uploadFileModel?: never;

  errors: Error[] = [];

  constructor(
    readonly unzipEntry: IUnzipDirEntry,
    readonly modelLoadService: ModelLoadService,
    readonly fileTypeService: FileTypeService,
    readonly parent?: UnzippedDirectoryOpener,
  ) {
    this.childOpeners.push(
      ...this.unzipEntry.children.map(
        childEntry => childEntry.dir
          ? new UnzippedDirectoryOpener(childEntry, modelLoadService, fileTypeService, parent)
          : new UnzippedFileOpener(childEntry, this),
      ),
    );
  }

  getErrorsRecursively() {
    return this.errors.concat(this.childOpeners.flatMap(child => child.errors));
  }
}

/**
 * LoadingManager for using ThreeJS loaders inside of zip contexts
 * (converts "URL" loading to relative blob loading).
 */
class ZipRelativeLoadingManager extends LoadingManager {

  #objectURLRegistry = new Set<string>();

  constructor(
    readonly entityIdOfLoader: string,
    readonly parentDirectory?: UnzippedDirectoryOpener
  ) {
    super();
  }

  override resolveURL = (url: string): string => {
    if (url.startsWith('./')) {
      url = url.slice(2);
    }
    const match = this.parentDirectory?.childOpeners.find(entry => entry.unzipEntry.name === url);
    if (!match) {
      console.error('Failed to resolve url', JSON.stringify(url), 'while loading', this.entityIdOfLoader);
      return url;
    }
    if (match instanceof UnzippedDirectoryOpener) {
      throw new Error(`Cannot link ${this.entityIdOfLoader} to ${match.unzipEntry.name} which is a directory`);
    }

    const blob = match.unzipEntry.blob;

    const objUrl = URL.createObjectURL(blob);
    this.#objectURLRegistry.add(objUrl);
    return objUrl;
  }

  readonly #originalItemEnd = this.itemEnd.bind(this);
  readonly #originalItemError = this.itemError.bind(this);

  override itemEnd = (url: string) => {
    URL.revokeObjectURL(url);
    this.#objectURLRegistry.delete(url);
    this.#originalItemEnd(url);
  }
  override itemError = (url: string) => {
    URL.revokeObjectURL(url);
    this.#objectURLRegistry.delete(url);
    this.#originalItemError(url);
  }
}

