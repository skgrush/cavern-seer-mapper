import { BoxHelper, Group, Mesh } from "three";
import { BaseRenderModel } from "./base.render-model";
import { FileModelType } from "../model-type.enum";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { Subject } from "rxjs";
import { ISimpleVector3 } from "../simple-types";

export class ObjRenderModel extends BaseRenderModel<FileModelType.obj> {
  override readonly type = FileModelType.obj;
  readonly #childOrPropertyChanged = new Subject<void>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override readonly identifier: string;
  override readonly rendered = true;
  override get position() {
    return this.#object.position;
  }

  readonly #object: Group;
  readonly #boxHelper: BoxHelper;
  readonly #blob: Blob;

  constructor(
    identifier: string,
    object: Group,
    blob: Blob,
  ) {
    super();
    this.#object = object;
    this.#blob = blob;
    this.#boxHelper = new BoxHelper(object);

    this.identifier = identifier
  }

  override serialize() {
    return this.#blob;
  }

  override setPosition({ x, y, z }: ISimpleVector3): boolean {
    this.#object.position.set(x, y, z);
    this.#childOrPropertyChanged.next();
    return true;
  }

  override setMaterial(material: BaseMaterialService<any>): void {
    this.#object.traverse(child => {
      if (child instanceof Mesh) {
        child.material = material.material;
      }
    });
  }

  override addToGroup(group: Group): void {
    if (this.#object.parent !== null) {
      throw new Error('attempt to add ObjRenderModel to group while model already has a parent');
    }
    group.add(this.#object);
  }
  override removeFromGroup(group: Group): void {
    group.remove(this.#object);
  }

  override dispose(): void {
    this.#boxHelper.dispose();
  }
}
