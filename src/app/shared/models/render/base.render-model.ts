import { Group, Vector3 } from "three";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { FileModelType } from "../model-type.enum";
import { Observable } from "rxjs";
import { ISimpleVector3 } from "../simple-types";
import { BaseModelManifest } from "../model-manifest";

export abstract class BaseRenderModel<T extends FileModelType> {

  abstract readonly type: T;
  abstract readonly childOrPropertyChanged$: Observable<void>;
  abstract readonly identifier: string;
  abstract readonly position: Readonly<Vector3>;
  abstract readonly rendered: boolean;
  abstract readonly comment: string | null;

  abstract setComment(comment: string | null): boolean;
  abstract serialize(): Blob | null;

  abstract setPosition(pos: ISimpleVector3): boolean;

  abstract setMaterial(material: BaseMaterialService<any>): void;

  abstract addToGroup(group: Group): void;
  abstract removeFromGroup(group: Group): void;

  abstract dispose(): void;

  setFromManifest(manifest: BaseModelManifest, path: string): void {
    const pos = manifest.getPosition(path);

    if (pos) {
      this.setPosition(pos);
    }
  }
}
