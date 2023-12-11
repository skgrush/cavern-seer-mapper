import { BaseRenderModel } from "./render/base.render-model";
import { GroupRenderModel } from "./render/group.render-model";
import { ISimpleVector3 } from "./simple-types";


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
}


export type IMetadataEntryV0 = {
  readonly position: ISimpleVector3,
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
    const storePosition = model.position.length() !== 0;

    const shouldStoreMetadata = storePosition;
    if (shouldStoreMetadata) {
      const { x, y, z } = model.position;
      const metadata: IMetadataEntryV0 = {
        position: { x, y, z },
      };

      buildingManifest.metadata[path] = metadata;
    }

    if (model instanceof GroupRenderModel) {
      for (const child of model.children) {
        this.#recursivelyBuildManifestFromModel(child, path, buildingManifest, false);
      }
    }
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
}

type IBuildingManifest = {
  readonly version: number;
  readonly metadata: Partial<Record<string, IMetadataEntryV0>>;
}
