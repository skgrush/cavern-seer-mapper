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

  override getPosition(path: string): ISimpleVector3 | undefined {
    return this.metadata[path]?.position;
  }
}
