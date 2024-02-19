import { Group, Mesh, Vector3 } from 'three';
import { BaseMaterialService } from '../../services/materials/base-material.service';
import { FileModelType } from '../model-type.enum';
import { Observable } from 'rxjs';
import { ISimpleVector3 } from '../simple-types';
import { BaseModelManifest } from '../model-manifest';
import { BaseAnnotation } from '../annotations/base.annotation';
import { AnnotationBuilderService } from '../../services/annotation-builder.service';
import { ModelChangeType } from '../model-change-type.enum';
import { filterErrors, filterSuccesses } from '../result';
import { IMapperUserData } from '../user-data';

export abstract class BaseRenderModel<T extends FileModelType> {

  abstract readonly type: T;
  abstract readonly childOrPropertyChanged$: Observable<ModelChangeType>;
  abstract readonly identifier: string;
  abstract readonly position: Readonly<Vector3>;
  abstract readonly rendered: boolean;
  abstract readonly comment: string | null;

  abstract setComment(comment: string | null): boolean;
  abstract serialize(): Blob | null;

  abstract addToGroup(group: Group): void;
  abstract removeFromGroup(group: Group): void;

  abstract dispose(): void;

  setFromManifest(manifest: BaseModelManifest, path: string, annoBuilder: AnnotationBuilderService): Error[] {
    return [];
  }
}

export abstract class BaseVisibleRenderModel<T extends FileModelType> extends BaseRenderModel<T> {
  abstract readonly visible: boolean;
  protected abstract readonly _group: Group;

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

  abstract setPosition(pos: ISimpleVector3): boolean;
  abstract setVisibility(visible: boolean): void;

  /**
   * Default implementation traverses the meshes and calls `material.updateMesh`
   * on all meshes which are annotated with {@link IMapperUserData.fromSerializedModel}.
   */
  setMaterial(material: BaseMaterialService<any>): void {
    this._group.traverse(child => {
      if (child instanceof Mesh && (child.userData as IMapperUserData).fromSerializedModel) {
        material.updateMesh(child);
      }
    });
  }

  override setFromManifest(manifest: BaseModelManifest, path: string, annoBuilder: AnnotationBuilderService): Error[] {
    const pos = manifest.getPosition(path);
    const annoResults = manifest.getAnnotations(path, annoBuilder);

    const errors: Error[] = [];

    if (pos) {
      this.setPosition(pos);
    }
    if (annoResults) {
      errors.push(...filterErrors(annoResults).map(r => r.error));
      for (const anno of filterSuccesses(annoResults).map(r => r.result)) {
        this.addAnnotation(anno);
      }
    }

    errors.push(...super.setFromManifest(manifest, path, annoBuilder));

    return errors;
  }
}
