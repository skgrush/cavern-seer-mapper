import { Subject } from "rxjs";
import { FileModelType } from "../model-type.enum";
import { BaseVisibleRenderModel } from "./base.render-model";
import { Group, Mesh, Object3DEventMap, Vector3 } from "three";
import type { CSMeshSnapshot, SurveyLine, SurveyStation } from "../../types/cavern-seer-scan";
import { UploadFileModel } from "../upload-file-model";
import { ISimpleVector3 } from "../simple-types";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import { BaseAnnotation } from "../annotations/base.annotation";
import { ModelChangeType } from "../model-change-type.enum";
import { IMapperUserData } from "../user-data";

export interface IScanFileParsed {
  readonly encodingVersion: bigint;
  readonly timestamp: Date;
  readonly name: string;
  readonly group: Group;
  readonly startSnapshot: CSMeshSnapshot | null;
  readonly endSnapshot: CSMeshSnapshot | null;
  readonly stations: SurveyStation[];
  readonly lines: SurveyLine[];
}

export class CavernSeerScanRenderModel extends BaseVisibleRenderModel<FileModelType.cavernseerscan> {
  override readonly type = FileModelType.cavernseerscan;
  override readonly #childOrPropertyChanged = new Subject<ModelChangeType>();
  override readonly childOrPropertyChanged$ = this.#childOrPropertyChanged.asObservable();
  override readonly position: Readonly<Vector3> = new Vector3();
  override readonly identifier: string;
  override comment: string | null;
  override readonly rendered = true;

  readonly #blob: Blob;
  readonly #parsedScanFile: IScanFileParsed;
  readonly #group: Group;
  readonly #annotations = new Set<BaseAnnotation>();

  constructor(
    identifier: string,
    parsedScanFile: IScanFileParsed,
    blob: Blob,
    comment: string | null,
  ) {
    super();

    this.identifier = identifier;
    this.comment = comment;
    this.#blob = blob;

    this.#parsedScanFile = parsedScanFile;
    this.#group = parsedScanFile.group;

    debugger;

    (this.#group.userData as IMapperUserData).fromSerializedModel = true;
    this.#group.traverse(child => {
      (child.userData as IMapperUserData).fromSerializedModel = true;
    })
  }

  static fromUploadModelAndParsedScanFile(uploadModel: UploadFileModel, parsedScan: IScanFileParsed) {
    const { identifier, blob, comment } = uploadModel;
    return new CavernSeerScanRenderModel(
      identifier,
      parsedScan,
      blob,
      comment,
    );
  }

  override setComment(comment: string | null): boolean {
    this.comment = comment;
    return true;
  }
  override serialize(): Blob | null {
    return this.#blob;
  }
  override setPosition({ x, y, z }: ISimpleVector3): boolean {
    this.#group.position.set(x, y, z);
    this.#childOrPropertyChanged.next(ModelChangeType.PositionChanged);
    return true;

  }
  override setMaterial(material: BaseMaterialService<any>): void {
    this.#group.traverse(child => {
      if (child instanceof Mesh && (child.userData as IMapperUserData).fromSerializedModel) {
        child.material = material.material;
      }
    });
  }
  override addToGroup(group: Group<Object3DEventMap>): void {
    if (this.#group.parent !== null) {
      throw new Error('attempt to add CavernSeerScanRenderModel to group while model already has a parent');
    }
    group.add(this.#group);
  }
  override removeFromGroup(group: Group<Object3DEventMap>): void {
    group.remove(this.#group);
  }
  override dispose(): void {
    // throw new Error("Method not implemented.");
  }
  override getAnnotations(): readonly BaseAnnotation[] {
    return [...this.#annotations];
  }

  override addAnnotation(anno: BaseAnnotation, toGroup?: Group<Object3DEventMap> | undefined): boolean {
    if (toGroup && this.#group !== toGroup) {
      return false;
    }

    anno.addToGroup(this.#group);
    this.#annotations.add(anno);
    this.#childOrPropertyChanged.next(ModelChangeType.EntityAdded);
    return true;
  }

  override removeAnnotations(annosToDelete: Set<BaseAnnotation>): void {
    for (const anno of annosToDelete) {

      const deleted = this.#annotations.delete(anno);
      if (!deleted) {
        continue;
      }

      anno.removeFromGroup(this.#group);
      this.#childOrPropertyChanged.next(ModelChangeType.EntityRemoved);

      annosToDelete.delete(anno);
    }
  }


}
