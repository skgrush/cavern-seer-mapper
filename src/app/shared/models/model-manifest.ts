import { ignoreNullishArray } from "../operators/ignore-nullish";
import { AnnotationBuilderService } from "../services/annotation-builder.service";
import { BaseAnnotation } from "./annotations/base.annotation";
import { IMetadataBaseAnnotationV0, IMetadataEntryV0 } from "./manifest/types.v0";
import { BaseRenderModel, BaseVisibleRenderModel } from "./render/base.render-model";
import { GroupRenderModel } from "./render/group.render-model";
import { Result } from "./result";
import { ISimpleVector3, simpleVector3FromVector3 } from "./simple-types";


export function modelManifestParse(jsonString: string): BaseModelManifest {
  const json = JSON.parse(jsonString);

  const version = json.version;
  if (!version) {
    return ModelManifestV0.fromJson(json);
  }

  console.error('modelManifestParse() context:', jsonString, json);
  throw new Error(`unexpected manifest version ${version}`);
}

export abstract class BaseModelManifest {
  abstract readonly version: number;

  abstract getPosition(path: string): ISimpleVector3 | undefined;
  abstract getAnnotations(path: string, annoBuilder: AnnotationBuilderService): undefined | readonly Result<BaseAnnotation>[];
}

/**
 * Manifest V0 only stores positions of entries, and only if they are non-zero.
 */
export class ModelManifestV0 extends BaseModelManifest {
  readonly version = 0;

  protected constructor(
    /**
     * Partial mapping of zip paths to metadata objects.
     */
    readonly metadata: Readonly<Partial<Record<string, IMetadataEntryV0>>>,
  ) {
    super();
  }

  static fromJson(json: any): ModelManifestV0 {
    const metadata = json.metadata ?? {};
    return new ModelManifestV0(
      metadata,
    );
  }

  static fromModel(model: GroupRenderModel): ModelManifestV0 {
    const buildingManifest: IBuildingManifest = {
      version: 0,
      metadata: {},
    };
    this.#recursivelyBuildManifestFromModel(model, '', buildingManifest, true);

    return new ModelManifestV0(
      buildingManifest.metadata,
    );
  }

  static #recursivelyBuildManifestFromModel(
    model: BaseRenderModel<any>,
    parentPath: string,
    buildingManifest: IBuildingManifest,
    isTopGroup: boolean,
  ) {
    console.assert(!parentPath || parentPath.endsWith('/'), 'whoops, parentPath should be empty or slash-suffixed!');

    const path = isTopGroup
      ? parentPath
      : `${parentPath}${model.identifier}`;

    const annotations = this.#buildAnnotations(model);

    const storePosition = model.position.length() !== 0;
    const storeAnnotations = !!annotations;
    const shouldStoreMetadata = storePosition || storeAnnotations;
    if (shouldStoreMetadata) {
      const metadata: IMetadataEntryV0 = {
        position: simpleVector3FromVector3(model.position),
        annotations: annotations ?? undefined,
      };

      buildingManifest.metadata[path] = metadata;
    }

    if (model instanceof GroupRenderModel) {
      for (const child of model.children) {
        this.#recursivelyBuildManifestFromModel(child, path, buildingManifest, false);
      }
    }
  }

  static #buildAnnotations(model: BaseRenderModel<any>): IMetadataBaseAnnotationV0[] | null {
    if (model instanceof BaseVisibleRenderModel) {
      const serializedAnnos = model.getAnnotations()
        .map(anno => anno.serializeToManifest(0))
        .filter(ignoreNullishArray);

      if (serializedAnnos.length > 0) {
        return serializedAnnos;
      }
    }
    return null;
  }

  serialize() {
    return new Blob([
      JSON.stringify({
        version: this.version,
        metadata: this.metadata,
      } satisfies IBuildingManifest),
    ], {
      type: 'application/json',
    });
  }

  override getPosition(path: string): ISimpleVector3 | undefined {
    return this.metadata[path]?.position;
  }

  override getAnnotations(path: string, annoBuilder: AnnotationBuilderService): readonly Result<BaseAnnotation>[] | undefined {
    return this.metadata[path]
      ?.annotations
      ?.map(anno => annoBuilder.buildAnnotationFromManifest(anno));
  }
}

type IBuildingManifest = {
  readonly version: number;
  readonly metadata: Partial<Record<string, IMetadataEntryV0>>;
}
