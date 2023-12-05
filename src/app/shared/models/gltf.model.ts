import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { BaseModel } from "./base.model";
import { FileModelType } from "./model-type.enum";
import { BaseMaterialService } from "../services/3d-managers/base-material.service";
import { Group, Object3DEventMap } from "three";

export class GltfModel extends BaseModel<FileModelType.gLTF> {
  override readonly type = FileModelType.gLTF;

  readonly #fileOrUrl: File | URL;
  readonly #object: GLTF;

  constructor(
    fileOrUrl: File | URL,
    object: GLTF,
  ) {
    super();
    this.#fileOrUrl = fileOrUrl;
    this.#object = object;
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
