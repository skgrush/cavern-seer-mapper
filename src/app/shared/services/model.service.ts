import { Injectable, Type } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, OperatorFunction, defer, from, map, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Group, Loader, LoadingManager, Object3D, Object3DEventMap } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';


export enum FileModelType {
  unknown = '',
  /** An OBJ file */
  obj = 'obj',
  /** gLTF or GLB file */
  gLTF = 'gltf',
}

export type UploadFileModel = {
  readonly file: File;
  readonly type: FileModelType;
};

export abstract class BaseFileLoadEvent<T> { }
export class FileLoadStartEvent<T> extends BaseFileLoadEvent<T> { }
export class FileLoadProgressEvent<T> extends BaseFileLoadEvent<T> {
  constructor(readonly loaded: number, readonly total: number) {
    super();
  }
}
export class FileLoadCompleteEvent<T> extends BaseFileLoadEvent<T> {
  constructor(readonly result: T) {
    super();
  }
}
export type FileLoadEvent<T> =
  | FileLoadStartEvent<T>
  | FileLoadProgressEvent<T>
  | FileLoadCompleteEvent<T>;

@Injectable()
export class ModelService {

  readonly #objLoader = defer(() =>
    import('three/examples/jsm/loaders/OBJLoader.js')
  ).pipe(
    map(({ OBJLoader }) => OBJLoader),
    shareReplay(1),
  );

  readonly #gltfLoader = defer(() =>
    import('three/examples/jsm/loaders/GLTFLoader.js')
  ).pipe(
    map(({ GLTFLoader }) => GLTFLoader),
    shareReplay(1),
  );

  *mapFileList(files: FileList) {
    for (let i = 0; i < files.length; ++i) {
      yield this.mapFileModel(files[i]);
    }
  }

  mapFileModel(file: File): UploadFileModel {
    const filenameLower = file.name.toLowerCase();
    if (file.type === 'model/obj' || filenameLower.endsWith('.obj')) {
      return { file, type: FileModelType.obj };
    }
    if (
      file.type === 'model/gltf+json' || filenameLower.endsWith('gltf') ||
      file.type === 'model/gltf-binary' || filenameLower.endsWith('glb')
    ) {
      return { file, type: FileModelType.gLTF };
    }
    return { file, type: FileModelType.unknown };
  }

  loadFile(file: UploadFileModel): Observable<FileLoadEvent<Group<Object3DEventMap>>/* | GLTF*/> {
    return defer(() => {
      if (file.type === FileModelType.obj) {
        return this.loadObj(file.file);
      }
      // if (file.type === FileModelType.gLTF) {
      //   return this.loadGltf(file.file);
      // }
      return throwError(() => new Error(`Unsupported file type for ${file.file.name}`));
    }).pipe(tap({
      next: v => console.info('loadFile.next', v),
      complete: () => console.info('loadFile.complete'),
      error: e => console.error('loadFile.error', e),
    }));
  }

  loadObj(file: File) {
    const url = URL.createObjectURL(file);
    return this.loadObjFromUrl(url).pipe(this.#revokeUrlOnEnd(url));
  }

  loadObjFromUrl(url: string) {
    return this.#objLoader.pipe(
      switchMap(OBJLoader => this.#load(OBJLoader, url)),
    );
  }

  loadGltf(file: File) {
    const url = URL.createObjectURL(file);
    return this.loadGltfFromUrl(url).pipe(this.#revokeUrlOnEnd(url));
  }

  loadGltfFromUrl(url: string) {
    return this.#gltfLoader.pipe(
      switchMap(GLTFLoader => this.#load(GLTFLoader, url))
    );
  }

  #load<TLoader extends Type<Loader>>(loaderType: TLoader, url: string) {
    type T = TLoader extends Type<Loader<infer TInner>> ? TInner : never;

    return new Observable<FileLoadEvent<T>>(subscriber => {
      const loader = new loaderType();
      loader.load(
        url,
        data => {
          subscriber.next(new FileLoadCompleteEvent(data));
          subscriber.complete();
        },
        prog => subscriber.next(new FileLoadProgressEvent(prog.loaded, prog.total)),
        err => subscriber.error(err),
      );
    });
  }

  #revokeUrlOnEnd<T>(url: string): MonoTypeOperatorFunction<T> {
    const fn = () => {
      URL.revokeObjectURL(url)
    };
    return tap({
      complete: fn,
      error: fn,
    });
  }
}
