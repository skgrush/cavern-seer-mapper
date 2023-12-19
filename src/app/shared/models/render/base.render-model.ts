import { Group, Vector3 } from "three";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { FileModelType } from "../model-type.enum";
import { Observable } from "rxjs";
import { ISimpleVector3 } from "../simple-types";
import { BaseModelManifest } from "../model-manifest";
import { BaseAnnotation } from "../annotations/base.annotation";
import { AnnotationBuilderService } from "../../services/annotation-builder.service";

export abstract class BaseRenderModel<T extends FileModelType> {

  abstract readonly type: T;
  abstract readonly childOrPropertyChanged$: Observable<void>;
  abstract readonly identifier: string;
  abstract readonly position: Readonly<Vector3>;
  abstract readonly rendered: boolean;
  abstract readonly comment: string | null;

  abstract setComment(comment: string | null): boolean;
  abstract serialize(): Blob | null;

  abstract addToGroup(group: Group): void;
  abstract removeFromGroup(group: Group): void;

  abstract dispose(): void;

  setFromManifest(manifest: BaseModelManifest, path: string, annoBuilder: AnnotationBuilderService): void { }
}

export abstract class BaseVisibleRenderModel<T extends FileModelType> extends BaseRenderModel<T> {
  abstract getAnnotations(): readonly BaseAnnotation[];

  /**
   * Try to add the annotation; return false if this isn't the correct group.
   * If `toGroup` is undefined, will be added to this group.
   */
  abstract addAnnotation(anno: BaseAnnotation, toGroup?: Group): boolean;
  /**
   * Try to remove these annotations.
   * the implementation should mutate the original set if they are removed.
   */
  abstract removeAnnotations(annosToDelete: Set<BaseAnnotation>): void;
  abstract setMaterial(material: BaseMaterialService<any>): void;

  abstract setPosition(pos: ISimpleVector3): boolean;

  override setFromManifest(manifest: BaseModelManifest, path: string, annoBuilder: AnnotationBuilderService): void {
    const pos = manifest.getPosition(path);
    const annos = manifest.getAnnotations(path, annoBuilder);

    if (pos) {
      this.setPosition(pos);
    }
    if (annos) {
      for (const anno of annos) {
        this.addAnnotation(anno);
      }
    }

    super.setFromManifest(manifest, path, annoBuilder);
  }
}
