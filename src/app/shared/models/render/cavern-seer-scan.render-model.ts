import { Subject } from "rxjs";
import { BufferGeometry, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, Object3DEventMap, PlaneGeometry, SphereGeometry, Texture, Vector3 } from "three";
import { float4x4ToMatrix4 } from "../../functions/float4x4-to-matrix4";
import { markSceneOfItemForReRender } from "../../functions/mark-scene-of-item-for-rerender";
import { ignoreNullishArray } from "../../operators/ignore-nullish";
import { BaseMaterialService } from "../../services/3d-managers/base-material.service";
import type { CSMeshSnapshot, SurveyLine, SurveyStation } from "../../types/cavern-seer-scan";
import { BaseAnnotation } from "../annotations/base.annotation";
import { TemporaryAnnotation } from "../annotations/temporary.annotation";
import { ModelChangeType } from "../model-change-type.enum";
import { FileModelType } from "../model-type.enum";
import { RenderingOrder } from "../rendering-layers";
import { ISimpleVector3 } from "../simple-types";
import { UploadFileModel } from "../upload-file-model";
import { IMapperUserData } from "../user-data";
import { BaseVisibleRenderModel } from "./base.render-model";

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
  override readonly identifier: string;
  override comment: string | null;
  override readonly rendered = true;

  override get position() {
    return this.#group.position;
  }
  override get visible() {
    return this.#group.visible;
  }

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

    (this.#group.userData as IMapperUserData).fromSerializedModel = true;
    this.#group.traverse(child => {
      (child.userData as IMapperUserData).fromSerializedModel = true;
    });

    const surveyLineAnnotation = this.#createSurveyLineAnnotation(parsedScanFile);
    if (surveyLineAnnotation) {
      this.addAnnotation(surveyLineAnnotation);
    }

    for (const anno of this.#createImageAnchors(parsedScanFile)) {
      this.addAnnotation(anno);
    }
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
    markSceneOfItemForReRender(this.#group);
    return true;

  }
  override setMaterial(material: BaseMaterialService<any>): void {
    this.#group.traverse(child => {
      if (child instanceof Mesh && (child.userData as IMapperUserData).fromSerializedModel) {
        child.material = material.material;
      }
    });
  }

  override setVisibility(visible: boolean) {
    this.#group.visible = visible;
    markSceneOfItemForReRender(this.#group);
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

  #createSurveyLineAnnotation(parsedScanFile: IScanFileParsed) {
    if (!parsedScanFile.lines.length) {
      return null;
    }

    const identifierPointMap = new Map(
      parsedScanFile.stations.map(station => {
        const transform = float4x4ToMatrix4(station.transform);
        const point = new Vector3().setFromMatrixPosition(transform);
        return [station.identifier.value, point];
      }),
    );

    const startEndMap = new Map(
      parsedScanFile.lines.map(({ startIdentifier, endIdentifier }) => {
        return [startIdentifier.value, endIdentifier.value];
      }),
    );
    const ends = new Set(startEndMap.values());

    const first = [...startEndMap.keys()].find(key => !ends.has(key));

    if (first === undefined) {
      console.error('no first element in survey lines?');
      return null;
    }

    const points: Vector3[] = [];

    let currentStationId: bigint | undefined = first;
    while (currentStationId) {
      const point = identifierPointMap.get(currentStationId);
      if (point === undefined) {
        console.error('Failed to find SurveyStation', currentStationId);
        return null;
      }
      points.push(point);
      currentStationId = startEndMap.get(currentStationId);
    }

    const stationMaterial = new MeshBasicMaterial({ color: 0x777777 });
    stationMaterial.depthTest = false;
    const stationObjects = [...identifierPointMap.entries()].map(([ident, position]) => {
      const geo = new SphereGeometry(0.1, 16, 16);
      const sphere = new Mesh(geo, stationMaterial);
      sphere.position.copy(position);
      sphere.userData['cs:surveyStation'] = true;
      sphere.renderOrder = RenderingOrder.Annotation;
      return sphere;
    })

    const group = new Group();
    (group.userData as IMapperUserData).isAnnotationGroup = true;

    const material = new LineBasicMaterial({ color: 0x00FF00 });
    const geometry = new BufferGeometry().setFromPoints(points);
    const line = new Line(geometry, material);

    material.depthTest = false;
    line.renderOrder = RenderingOrder.Annotation;
    line.userData['cs:surveyLine'] = true;

    group.add(line);
    group.add(...stationObjects);

    return new TemporaryAnnotation(
      `SurveyLine for ${parsedScanFile.name}`,
      group,
      l => points[0],
    );
  }

  #createImageAnchors({ startSnapshot, endSnapshot }: IScanFileParsed) {
    return [startSnapshot, endSnapshot]
      .map(snapshot => this.#createImageAnchor(snapshot))
      .filter(ignoreNullishArray);
  }

  #createImageAnchor(snapshot: CSMeshSnapshot | null) {
    if (!snapshot) {
      return;
    }

    let dimensions: readonly [width: number, height: number] | undefined;
    try {
      dimensions = this.#jankilyGetSizeOfJpeg(snapshot.imageData);
    } catch (e) {
      console.warn('Unexpected error while parking JPEG data', e);
      return;
    }
    if (!dimensions) {
      return;
    }

    const [width, height] = dimensions;

    return this.#imageToTexture(snapshot, width, height);
  }

  #imageToTexture(snapshot: CSMeshSnapshot, width: number, height: number) {
    const img = new Image(width, height);
    img.src = URL.createObjectURL(new Blob([snapshot.imageData], { type: 'image/jpeg' }));

    const texture = new Texture(img);
    texture.needsUpdate = true;
    const material = new MeshBasicMaterial({
      map: texture,
    });

    const mesh = new Mesh(new PlaneGeometry(width / height, 1), material);

    mesh.userData['cs:snapshot'] = true;
    mesh.userData['cs:identifier'] = snapshot.identifier;
    mesh.userData['cs:name'] = snapshot.name;

    // pre-rotate because exif nonsense
    mesh.rotateZ(Math.PI / 2);

    mesh.applyMatrix4(float4x4ToMatrix4(snapshot.transform));

    console.info('img', snapshot, mesh);

    return new TemporaryAnnotation(
      `Snapshot ${snapshot.name ?? snapshot.identifier}`,
      mesh,
      l => mesh.position,
    );
  }

  /**
   * @see https://yasoob.me/posts/understanding-and-writing-jpeg-decoder-in-python/
   */
  #jankilyGetSizeOfJpeg(buffer: ArrayBuffer): undefined | readonly [width: number, height: number] {
    const view = new DataView(buffer);

    if (view.getUint16(0, false) !== 0xFF_D8) {
      console.warn('File format is not JPEG; ignoring');
      return;
    }

    let byteOffset = 2;

    while (true) {
      const segmentMarker = view.getUint16(byteOffset, false);
      byteOffset += 2;

      if (segmentMarker === 0xFFD8) { // empty segments
        continue;
      }
      if (segmentMarker === 0xFFD9 || segmentMarker === 0xFFDA) {
        console.warn('Failed to find start-of-frame');
        return;
      }
      if ((segmentMarker >> 8) !== 0xFF) {
        console.warn('Failed to read JPEG data');
        return;
      }

      const segmentByteLength = view.getUint16(byteOffset, false);
      byteOffset += 2;

      switch (segmentMarker) {
        case 0xFFC0: {
          // start-of-frame
          const precision = view.getUint8(byteOffset);
          ++byteOffset;
          const height = view.getUint16(byteOffset);
          byteOffset += 2;
          const width = view.getUint16(byteOffset);
          return [width, height];
        }

        default:
          byteOffset += segmentByteLength - 2;
      }
    }
  }
}
