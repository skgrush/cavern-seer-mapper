import { Injectable, Injector, Type, inject } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, defer, filter, forkJoin, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
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
import { IUnzipDirEntry, IUnzipEntry } from './zip.service';
import { BaseRenderModel } from '../models/render/base.render-model';
import { BaseModelManifest, modelManifestParse } from '../models/model-manifest';

@Injectable()
export class ModelLoadService {

  readonly manifestFileName = '__cavern-seer-manifest.json';

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

  loadFile(file: UploadFileModel): Observable<FileLoadEvent<AnyRenderModel>> {
    return defer(() => {
      switch (file.type) {

        case FileModelType.obj:
          return this.loadObj(file);

        case FileModelType.gLTF:
          return this.loadGltf(file);

        case FileModelType.group:
          return this.loadGroup(file);

        default:
          return of(
            new FileLoadCompleteEvent(new UnknownRenderModel(file))
          );
      }
    }).pipe(tap({
      next: v => console.info('loadFile.next', v),
      complete: () => console.info('loadFile.complete'),
      error: e => console.error('loadFile.error', e),
    }));
  }

  loadObj(file: UploadFileModel): Observable<FileLoadEvent<ObjRenderModel>> {
    const url = new URL(URL.createObjectURL(file.blob));
    return this.#rawLoadObjFromUrl(url).pipe(
      this.#revokeUrlOnEnd(url),
      map(event => convertFileLoadEvent(
        event,
        (inp: Group) => new ObjRenderModel(file.identifier, inp),
      ))
    );
  }

  // loadObjFromUrl(url: URL) {
  //   return this.#rawLoadObjFromUrl(url).pipe(
  //     this.#revokeUrlOnEnd(url),
  //     map(event => convertFileLoadEvent(
  //       event,
  //       (inp: Group) => new ObjRenderModel(url, inp),
  //     )),
  //   );
  // }

  #rawLoadObjFromUrl(url: URL) {
    return this.#objLoader$.pipe(
      switchMap(OBJLoader => this.#load(OBJLoader, url)),
    );
  }

  loadGltf(file: UploadFileModel): Observable<FileLoadEvent<GltfRenderModel>> {
    const url = new URL(URL.createObjectURL(file.blob));
    return this.#rawLoadGltfFromUrl(url).pipe(
      this.#revokeUrlOnEnd(url),
      map(event => convertFileLoadEvent(
        event,
        (inp: GLTF) => new GltfRenderModel(file.identifier, inp),
      )),
    );
  }

  #rawLoadGltfFromUrl(url: URL) {
    return this.#gltfLoader$.pipe(
      switchMap(GLTFLoader => this.#load(GLTFLoader, url))
    );
  }

  loadGroup(file: UploadFileModel): Observable<FileLoadEvent<GroupRenderModel>> {
    if (this.#fileTypeService.isZip(file.mime, file.identifier)) {
      return this.#zipService$.pipe(
        switchMap(zs => zs.unzip$(file)),
        switchMap(({ file, ...dirEntry }) => this.#readManifest$(dirEntry)),
        switchMap(({ dirEntry, manifest }) => this.#loadZipEntriesRecursively$(dirEntry, manifest)),
        map(group => new FileLoadCompleteEvent(group)),
        tap(compl => console.info('group complete')),
      )
    }

    return throwError(() => new Error(`loadGroup doesn't support file ${file.type} of ${file.identifier}`));
  }

  #loadZipEntriesRecursively$(unzipEntry: IUnzipEntry, manifest?: BaseModelManifest): Observable<BaseRenderModel<any>> {
    return defer(() => {
      if (unzipEntry.dir) {
        if (unzipEntry.children.length === 0) {
          return of(GroupRenderModel.fromModels(unzipEntry.name, []));
        } else {
          return forkJoin(
            unzipEntry.children.map(child => this.#loadZipEntriesRecursively$(child, manifest)),
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
          })),
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

  #readManifest$(dirEntry: IUnzipDirEntry): Observable<{ dirEntry: IUnzipDirEntry, manifest?: BaseModelManifest }> {
    const fallback$ = () => of({ dirEntry });

    const manifestIdx = dirEntry.children.findIndex(entry => entry.name === this.manifestFileName);
    if (manifestIdx === -1) {
      return fallback$();
    }
    const manifestEntry = dirEntry.children[manifestIdx];

    if (manifestEntry.dir) {
      console.error('manifest file appears to be a directory?', manifestEntry);
      return fallback$();
    }

    return defer(() => manifestEntry.loader()).pipe(
      switchMap(jsonBlob => jsonBlob.text()),
      map(jsonString => modelManifestParse(jsonString)),
      map(manifest => ({
        manifest,
        dirEntry,
      })),
    )
  }

  #load<TLoader extends Type<Loader>>(loaderType: TLoader, url: URL) {
    type T = TLoader extends Type<Loader<infer TInner>> ? TInner : never;

    return new Observable<FileLoadEvent<T>>(subscriber => {
      const loader = new loaderType();
      loader.load(
        url.toString(),
        data => {
          subscriber.next(new FileLoadCompleteEvent(data));
          subscriber.complete();
        },
        prog => subscriber.next(new FileLoadProgressEvent(prog.loaded, prog.total)),
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
