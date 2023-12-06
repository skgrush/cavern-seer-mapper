import { Injectable, Type } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, defer, map, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Group, Loader } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FileLoadCompleteEvent, FileLoadEvent, FileLoadProgressEvent, convertFileLoadEvent } from '../events/file-load-events';
import { GltfRenderModel } from '../models/render/gltf.render-model';
import { FileModelType } from '../models/model-type.enum';
import { ObjRenderModel } from '../models/render/obj.render-model';

export type UploadFileModel = {
  readonly file: File;
  readonly type: FileModelType;
};

@Injectable()
export class ModelLoadService {

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

  loadFile(file: UploadFileModel): Observable<FileLoadEvent<ObjRenderModel | GltfRenderModel>> {
    return defer(() => {
      if (file.type === FileModelType.obj) {
        return this.loadObj(file.file);
      }
      if (file.type === FileModelType.gLTF) {
        return this.loadGltf(file.file);
      }
      return throwError(() => new Error(`Unsupported file type for ${file.file.name}`));
    }).pipe(tap({
      next: v => console.info('loadFile.next', v),
      complete: () => console.info('loadFile.complete'),
      error: e => console.error('loadFile.error', e),
    }));
  }

  loadObj(file: File): Observable<FileLoadEvent<ObjRenderModel>> {
    const url = new URL(URL.createObjectURL(file));
    return this.#rawLoadObjFromUrl(url).pipe(
      this.#revokeUrlOnEnd(url),
      map(event => convertFileLoadEvent(
        event,
        (inp: Group) => new ObjRenderModel(file, inp),
      ))
    );
  }

  loadObjFromUrl(url: URL) {
    return this.#rawLoadObjFromUrl(url).pipe(
      this.#revokeUrlOnEnd(url),
      map(event => convertFileLoadEvent(
        event,
        (inp: Group) => new ObjRenderModel(url, inp),
      )),
    );
  }

  #rawLoadObjFromUrl(url: URL) {
    return this.#objLoader.pipe(
      switchMap(OBJLoader => this.#load(OBJLoader, url)),
    );
  }

  loadGltf(file: File): Observable<FileLoadEvent<GltfRenderModel>> {
    const url = new URL(URL.createObjectURL(file));
    return this.#rawLoadGltfFromUrl(url).pipe(
      this.#revokeUrlOnEnd(url),
      map(event => convertFileLoadEvent(
        event,
        (inp: GLTF) => new GltfRenderModel(file, inp),
      )),
    );
  }

  #rawLoadGltfFromUrl(url: URL) {
    return this.#gltfLoader.pipe(
      switchMap(GLTFLoader => this.#load(GLTFLoader, url))
    );
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
