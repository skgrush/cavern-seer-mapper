import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { BaseRenderModel, ISimpleVector3 } from "./base.render-model";
import { FileModelType } from "../model-type.enum";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { Group, Object3DEventMap, Vector3 } from "three";
import { Subject } from "rxjs";

export class GltfRenderModel extends BaseRenderModel<FileModelType.gLTF> {
  override readonly type = FileModelType.gLTF;
  readonly #childOrPropertyChanged = new Subject<void>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override readonly identifier: string;
  override get position(): Readonly<Vector3> {
    throw new Error('position not implemented in GltfModel');
  }

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

  override setPosition(pos: ISimpleVector3): boolean {
    throw new Error("Method not implemented in GltfModel.");
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
