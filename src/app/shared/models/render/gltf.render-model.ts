import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { BaseRenderModel } from "./base.render-model";
import { FileModelType } from "../model-type.enum";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { Group, Object3DEventMap } from "three";
import { NEVER, Observable, Subject } from "rxjs";

export class GltfRenderModel extends BaseRenderModel<FileModelType.gLTF> {
  override readonly type = FileModelType.gLTF;
  readonly #childOrPropertyChanged = new Subject<void>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override readonly identifier: string;

  readonly #fileOrUrl: File | URL;
  readonly #object: GLTF;

  constructor(
    fileOrUrl: File | URL,
    object: GLTF,
  ) {
    super();
    this.#fileOrUrl = fileOrUrl;
    this.#object = object;

    this.identifier = this.#fileOrUrl instanceof URL
      ? this.#fileOrUrl.toString()
      : this.#fileOrUrl.name;
  }

  override setMaterial(material: BaseMaterialService<any>): void {
    throw new Error("Method not implemented in GltfModel.");
  }
  override addToGroup(group: Group<Object3DEventMap>): void {
    throw new Error("Method not implemented.");
  }
  override removeFromGroup(group: Group<Object3DEventMap>): void {
    throw new Error("Method not implemented.");
  }
  override dispose(): void {
    throw new Error("Method not implemented.");
  }
}
