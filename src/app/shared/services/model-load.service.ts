import { Injectable, Injector, Type, inject } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, defer, filter, first, firstValueFrom, forkJoin, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Group, Loader } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FileLoadCompleteEvent, FileLoadEvent, FileLoadProgressEvent, convertFileLoadEvent } from '../events/file-load-events';
import { GltfRenderModel } from '../models/render/gltf.render-model';
import { FileModelType } from '../models/model-type.enum';
import { ObjRenderModel } from '../models/render/obj.render-model';
import { FileTypeService } from './file-type.service';
import { GroupRenderModel } from '../models/render/group.render-model';
import { UploadFileModel } from '../models/upload-file-model';
import { UnknownRenderModel } from '../models/render/unknown.render-model';
import { AnyRenderModel } from '../models/render/any-render-model';
import type { IUnzipDirEntry, IUnzipEntry, IZipEntry } from './zip.service';
import { BaseRenderModel } from '../models/render/base.render-model';
import { BaseModelManifest, ModelManifestV0, modelManifestParse } from '../models/model-manifest';
import { TransportProgressHandler } from '../models/transport-progress-handler';

@Injectable()
export class ModelLoadService {

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

  exportModelForSerializing(model: BaseRenderModel<any>): Observable<null | Blob> {
    return of(model.serialize());
  }

  loadFile(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
  ): Observable<FileLoadEvent<AnyRenderModel>> {
    return defer(() => {
      switch (file.type) {

        case FileModelType.obj:
          return this.loadObj(file, progress);

        case FileModelType.gLTF:
          return this.loadGltf(file, progress);

        case FileModelType.group:
          return this.loadGroup(file, progress);

        default:
          return of(new FileLoadCompleteEvent(new UnknownRenderModel(file)));
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
  ): Observable<FileLoadEvent<ObjRenderModel>> {
    const url = new URL(URL.createObjectURL(file.blob));
    return this.#rawLoadObjFromUrl(url, progress).pipe(
      this.#revokeUrlOnEnd(url),
      map(event => convertFileLoadEvent(
        event,
        (inp: Group) => new ObjRenderModel(file.identifier, inp, file.blob),
      ))
    );
  }

  #rawLoadObjFromUrl(
    url: URL,
    progress?: TransportProgressHandler,
  ) {
    return this.#objLoader$.pipe(
      switchMap(OBJLoader => this.#load(OBJLoader, url, progress)),
    );
  }

  loadGltf(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
  ): Observable<FileLoadEvent<GltfRenderModel>> {
    const url = new URL(URL.createObjectURL(file.blob));
    return this.#rawLoadGltfFromUrl(url, progress).pipe(
      this.#revokeUrlOnEnd(url),
      map(event => convertFileLoadEvent(
        event,
        (inp: GLTF) => new GltfRenderModel(file.identifier, file.blob, inp),
      )),
    );
  }

  #rawLoadGltfFromUrl(
    url: URL,
    progress?: TransportProgressHandler,
  ) {
    return this.#gltfLoader$.pipe(
      switchMap(GLTFLoader => this.#load(GLTFLoader, url, progress))
    );
  }

  loadGroup(
    file: UploadFileModel,
    progress?: TransportProgressHandler,
  ): Observable<FileLoadEvent<GroupRenderModel>> {
    if (this.#fileTypeService.isZip(file.mime, file.identifier)) {
      return this.#zipService$.pipe(
        tap(() => progress?.setLoadedCount(0, `Unzipping...`)),
        switchMap(zs => zs.unzip$(file)),
        tap(() => progress?.setLoadedCount(0, `Unzipped! Preparing models...`)),
        switchMap(({ file, ...dirEntry }) => this.#readAndRemoveManifest$(dirEntry)),
        switchMap(({ dirEntry, manifest }) => this.#loadZipEntriesRecursively$(dirEntry, manifest, progress)),
        map(group => new FileLoadCompleteEvent(group)),
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
  ): Observable<BaseRenderModel<any>> {
    return defer(() => {
      if (unzipEntry.dir) {
        if (unzipEntry.children.length === 0) {
          return of(GroupRenderModel.fromModels(unzipEntry.name, []));
        } else {
          return forkJoin(
            unzipEntry.children.map(child => this.#loadZipEntriesRecursively$(child, manifest, progress)),
          ).pipe(
            map(results => GroupRenderModel.fromModels(unzipEntry.name, results)),
          );
        }
      } else {
        return defer(() => unzipEntry.loader()).pipe(
          switchMap(blob => this.loadFile({
            blob,
            identifier: unzipEntry.name,
            mime: blob.type,
            type: this.#fileTypeService.getType(blob.type, unzipEntry.name),
          }, progress)),
          filter((event): event is FileLoadCompleteEvent<BaseRenderModel<any>> => event instanceof FileLoadCompleteEvent),
          map(event => event.result),
        );
      }
    }).pipe(
      tap(model => {
        if (manifest) {
          model.setFromManifest(manifest, unzipEntry.path);
        }
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

  #load<TLoader extends Type<Loader>>(
    loaderType: TLoader,
    url: URL,
    progress?: TransportProgressHandler,
  ) {
    type T = TLoader extends Type<Loader<infer TInner>> ? TInner : never;

    return new Observable<FileLoadEvent<T>>(subscriber => {
      const loader = new loaderType();
      loader.load(
        url.toString(),
        data => {
          subscriber.next(new FileLoadCompleteEvent(data));
          subscriber.complete();
        },
        prog => {
          progress?.addToLoadedCount(prog.loaded);
          subscriber.next(new FileLoadProgressEvent(prog.loaded, prog.total));
        },
        err => subscriber.error(err),
      );
    });
  }

  #revokeUrlOnEnd<T>(url: URL): MonoTypeOperatorFunction<T> {
    const fn = () => {
      URL.revokeObjectURL(url.toString())
    };
    return tap({
      complete: fn,
      error: fn,
    });
  }
}
