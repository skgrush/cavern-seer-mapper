import { computed, inject, Injectable, signal, untracked } from '@angular/core';
import { BaseClickToolService } from './base-tool.service';
import { of, switchMap, take, tap, timer } from 'rxjs';
import { ModelManagerService } from '../model-manager.service';
import { ignoreNullish } from '../../operators/ignore-nullish';
import { TemporaryAnnotation } from '../../models/annotations/temporary.annotation';
import { BoxGeometry, Group, Intersection, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
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
// const fontSize = 0.05;

type IntersectionPair = {
  readonly floor: Intersection;
  readonly ceiling: Intersection;
}

class MapProbe {
  get identifier() {
    return `${this.origin.x}, ${this.origin.y}, ${this.origin.z}`;
  }

  readonly group: Group;

  constructor(
    readonly origin: Vector3,
    readonly downIntersections: readonly Intersection[],
    readonly upIntersections: readonly Intersection[],
    readonly minY: number,
    readonly fontSize: number,
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
      .sort((a, b) => b.y - a.y)
      [0];

    return pairs
      .map(({ floor, ceiling }) => ceiling.point.y - floor.point.y)
      .map(len => localize.formatLength(len, 0, 1))
      // we want heights ordered from top to bottom
      .reverse()
      .map((txt, i) => {
        const textGroup = this.#buildSingleTextItem(txt);
        textGroup.position.y = highestPoint.y - this.origin.y;
        textGroup.position.z = this.fontSize * i;
        return textGroup;
      });
  }

  #buildSingleTextItem(text: string) {

    const textGeometry = new TextGeometry(
      text,
      {
        font: droidSansFont,
        size: this.fontSize,
        height: this.fontSize / 5,
      },
    );
    textGeometry.computeBoundingBox();
    const textBox = textGeometry.boundingBox!;
    const textSize = textBox.getSize(new Vector3());

    const textMat = new MeshBasicMaterial({ color: 0x00 });
    const textMesh = new Mesh(
      textGeometry,
      textMat,
    );

    const boxGeometry = new BoxGeometry(
      textSize.x,
      textSize.y,
      0.001,
    );
    const boxMat = new MeshBasicMaterial({ color: 0xFFFFFF });
    const boxMesh = new Mesh(boxGeometry, boxMat);
    boxMesh.position.x = textSize.x / 2;
    boxMesh.position.y = textSize.y / 2;
    boxMesh.position.z = -textSize.z / 2;

    textMat.depthTest = false;
    textMesh.renderOrder = RenderingOrder.Annotation;

    const textGroup = new Group();
    textGroup.add(boxMesh, textMesh);
    textGroup.rotation.set(-Math.PI / 2, 0, 0);

    return textGroup;
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

  readonly #ceilingHeightsGroup = signal<undefined | TemporaryAnnotation<Group>>(undefined);
  readonly hasGroup = computed(() => !!this.#ceilingHeightsGroup());

  #stepSize = 0.25;

  override readonly id = 'full-height-map';
  override readonly label = 'Fully map ceiling heights';
  override readonly icon = computed(() => {
    const hasGroup = this.hasGroup();
    return ({
      icon: hasGroup ? 'delete_forever' : 'map',
    } as const);
  });

  override click() {
    this.#modelManager.currentOpenGroup$.pipe(
      // only take 1 THEN cut off on nullish; we don't want to hang if there's no group
      take(1),
      ignoreNullish(),
      switchMap(group => {
        const hasGroup = untracked(this.hasGroup);
        if (hasGroup) {
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
    raycaster.params['Mesh'].threshold = 0.1;

    const stepSize = this.#stepSize;
    const fontSize = stepSize / 5;
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

        finalResults.push(new MapProbe(origin, downResults, upResults, minY, fontSize, this.#localize));
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

    this.#ceilingHeightsGroup.set(anno);

    this.#alert.alert(AlertType.info, `Generated full height-map in ${Math.round(ts1 - ts0) / 1e3} sec`, 'X', {
      duration: 15e3,
    })
  }

  #clearAnnotations(group?: GroupRenderModel) {
    const anno = untracked(this.#ceilingHeightsGroup);
    if (!anno) {
      return;
    }
    group?.removeAnnotations(new Set([anno]));

    this.#ceilingHeightsGroup.set(undefined);
  }
}
