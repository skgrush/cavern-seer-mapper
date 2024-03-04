import { inject, Injectable } from '@angular/core';
import { BaseClickToolService } from './base-tool.service';
import { BehaviorSubject, map, of, switchMap, take, tap, timer } from 'rxjs';
import { ModelManagerService } from '../model-manager.service';
import { ignoreNullish } from '../../operators/ignore-nullish';
import { TemporaryAnnotation } from '../../models/annotations/temporary.annotation';
import { Group, Intersection, Mesh, MeshBasicMaterial, Object3D, Raycaster, Vector3 } from 'three';
import { CanvasService } from '../canvas.service';
import { IMapperUserData } from '../../models/user-data';
import { LocalizeService } from '../localize.service';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { droidSansFont } from '../../models/annotations/font';
import { RenderingOrder } from '../../models/rendering-layers';
import { GroupRenderModel } from '../../models/render/group.render-model';
import { AlertService, AlertType } from '../alert.service';

const yUp = new Vector3(0, 1, 0);
const yDown = new Vector3(0, -1, 0);
const fontSize = 0.05;

type IntersectionPair = {
  readonly floor: Intersection;
  readonly ceiling: Intersection;
}

class MapProbe {
  readonly identifier = `${this.origin.x}, ${this.origin.y}, ${this.origin.z}`;

  readonly group: Group;

  constructor(
    readonly origin: Vector3,
    readonly downIntersections: readonly Intersection[],
    readonly upIntersections: readonly Intersection[],
    readonly minY: number,
    localize: LocalizeService,
  ) {
    this.group = this.#toGroup(localize);
  }

  #toGroup(localize: LocalizeService) {
    const pairs = [...this.#getPairs()];

    const group = new Group();
    group.add(...this.#buildText(localize, pairs));
    group.position.copy(this.origin);

    return group;
  }

  #buildText(localize: LocalizeService, pairs: IntersectionPair[]) {

    const highestPoint = [...this.upIntersections, ...this.downIntersections]
      .map(i => i.point)
      .sort((a, b) => b.y - a.y)[0];

    return pairs
      .map(({ floor, ceiling }) => ceiling.point.y - floor.point.y)
      .map(len => localize.formatLength(len, 0, 1))
      // we want heights ordered from top to bottom
      .reverse()
      .map((txt, i) => {
        const textMesh = this.#builSingleTextItem(txt);
        textMesh.position.y = highestPoint.y - this.origin.y;
        textMesh.position.z = fontSize * i;
        return textMesh;
      });
  }

  #builSingleTextItem(text: string) {

    const textGeometry = new TextGeometry(
      text,
      {
        font: droidSansFont,
        size: fontSize,
        height: fontSize / 5,
        // bevelEnabled: true,
        // bevelSize: fontSize,
      },
    );
    const textMat = new MeshBasicMaterial({ color: 0x00 });
    textMat.depthTest = false;

    const mesh = new Mesh(
      textGeometry,
      textMat,
    );
    mesh.rotation.set(-Math.PI / 2, 0, 0);
    mesh.renderOrder = RenderingOrder.Annotation;
    return mesh;
  }

  *#getPairs(): Generator<IntersectionPair> {
    const bottom = this.downIntersections[this.downIntersections.length - 1];

    let nextFloor: undefined | Intersection = bottom;
    while (nextFloor) {
      const nextCeiling = this.#getFirstUpAbove(nextFloor.point);
      if (!nextCeiling) {
        return;
      }
      yield { floor: nextFloor, ceiling: nextCeiling };

      nextFloor = this.#getFirstDownAbove(nextCeiling.point);
    }
  }

  #getFirstDownAbove(point: Vector3) {
    return this.downIntersections.findLast(i => i.point.y > point.y);
  }
  #getFirstUpAbove(point: Vector3) {
    return this.upIntersections.find(i => i.point.y > point.y);
  }
}

@Injectable()
export class FullHeightMapToolService extends BaseClickToolService {

  readonly #modelManager = inject(ModelManagerService);
  readonly #canvas = inject(CanvasService);
  readonly #localize = inject(LocalizeService);
  readonly #alert = inject(AlertService);

  readonly #ceilingHeightsGroup$ = new BehaviorSubject<undefined | TemporaryAnnotation<Group>>(undefined);

  #stepSize = 0.25;

  override readonly id = 'full-height-map';
  override readonly label = 'Fully map ceiling heights';
  override readonly icon$ = this.#ceilingHeightsGroup$.pipe(
    map(annos => ({
      icon: annos ? 'delete_forever' : 'map',
    })),
  );

  override click() {
    this.#modelManager.currentOpenGroup$.pipe(
      take(1),
      ignoreNullish(),
      switchMap(group => {
        if (this.#ceilingHeightsGroup$.value !== undefined) {
          this.#clearAnnotations(group);
          return of();
        }

        this.#alert.alert(AlertType.warning, 'Generating full height-map will take time...');

        return timer(0).pipe(
          tap(() => this.#generateAnnotations(group)),
        );
      })
    ).subscribe();
  }

  #generateAnnotations(group: GroupRenderModel) {
    const boundingBox = group.getBoundingBox();

    const { x: minX, z: minZ, y: minY } = boundingBox.min;
    const { x: maxX, z: maxZ, y: maxY } = boundingBox.max;
    const rangeY = maxY - minY;

    const raycaster = new Raycaster(new Vector3(), yDown, 0, rangeY);

    const stepSize = this.#stepSize;
    const tmpResults: Intersection[] = [];
    const finalResults: MapProbe[] = [];

    function isSerializedModelIntersection(int: Intersection) {
      return (int.object.userData as IMapperUserData).fromSerializedModel;
    }

    const ts0 = performance.now();

    for (let x = minX; x <= maxX; x += stepSize) {
      for (let z = minZ; z <= maxZ; z += stepSize) {
        const origin = new Vector3(x, maxY, z);
        raycaster.ray.direction = yDown;
        raycaster.ray.origin.copy(origin);

        tmpResults.length = 0;
        this.#canvas.raycastWithPreparedRaycaster(raycaster, true, tmpResults);

        const downResults = tmpResults.filter(isSerializedModelIntersection);

        if (!downResults.length) {
          continue;
        }
        const lastDownResult = downResults[downResults.length - 1];

        raycaster.ray.direction = yUp;
        raycaster.ray.origin.copy(lastDownResult.point);

        tmpResults.length = 0;
        this.#canvas.raycastWithPreparedRaycaster(raycaster, true, tmpResults);

        const upResults = tmpResults.filter(isSerializedModelIntersection);

        if (!upResults.length) {
          continue;
        }

        finalResults.push(new MapProbe(origin, downResults, upResults, minY, this.#localize));
      }
    }

    const ts1 = performance.now();

    const annotationGroup = new Group();
    annotationGroup.children.push(...finalResults.map(r => r.group));
    const anno = new TemporaryAnnotation(
      'full-height-map',
      annotationGroup,
      o => o.position,
    );

    group.addAnnotation(anno);

    this.#ceilingHeightsGroup$.next(anno);

    this.#alert.alert(AlertType.info, `Generated full height-map in ${Math.round(ts1 - ts0) / 1e3} sec`, 'X', {
      duration: 10e3,
    })
  }

  #clearAnnotations(group: GroupRenderModel) {
    const anno = this.#ceilingHeightsGroup$.value;
    if (!anno) {
      return;
    }
    group.removeAnnotations(new Set([anno]));

    this.#ceilingHeightsGroup$.next(undefined);
  }


}
