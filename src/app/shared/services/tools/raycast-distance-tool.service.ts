import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { BehaviorSubject, Subject, map, of, takeUntil } from 'rxjs';
import { GridHelper, Group, Intersection, Mesh, Object3D, Vector2, Vector3 } from 'three';
import { formatLength } from '../../formatters/format-length';
import { CeilingHeightAnnotation } from '../../models/annotations/ceiling-height.annotation';
import { CanvasService } from '../canvas.service';
import { ModelManagerService } from '../model-manager.service';
import { SettingsService } from '../settings/settings.service';
import { BaseToolService } from './base-tool.service';

export enum RaycastDistanceMode {
  fromCamera = 1,
  ceiling = 2,
}

export type IRaycastCameraDistance = {
  readonly cameraDistance: number;
  readonly gridDistance: number;
  readonly absPoint: Readonly<Vector3>;
  readonly type: 'Mesh' | 'GridHelper' | null;
  readonly firstParentGroup: Group | null;
}

@Injectable()
export class RaycastDistanceToolService extends BaseToolService {
  readonly #canvasService = inject(CanvasService);
  readonly #modelManager = inject(ModelManagerService);
  readonly #localeId = inject(LOCALE_ID);
  readonly #settings = inject(SettingsService);

  readonly #stopSubject = new Subject<void>();

  readonly #cameraDistancesSubject = new BehaviorSubject<readonly IRaycastCameraDistance[]>([]);
  // TODO: what happens if ceiling distances are removed from the models?
  readonly #ceilingDistancesSubject = new BehaviorSubject<readonly CeilingHeightAnnotation[]>([]);
  readonly #modeSubject = new BehaviorSubject(RaycastDistanceMode.ceiling);
  readonly #showCeilingHeightsSubject = new BehaviorSubject(true);

  readonly cameraDistances$ = this.#cameraDistancesSubject.asObservable();
  readonly ceilingDistances$ = this.#ceilingDistancesSubject.asObservable();
  readonly mode$ = this.#modeSubject.asObservable();
  readonly showCeilingHeights$ = this.#showCeilingHeightsSubject.asObservable();

  override readonly id = 'raycast-distance';
  override readonly label = 'Raycast distance';
  override readonly icon = 'biotech';
  override readonly cursor$ = of('crosshair');

  toggleCeilingHeights(show: boolean) {
    if (show === this.#showCeilingHeightsSubject.value) {
      return;
    }
    this.#showCeilingHeightsSubject.next(show);
    for (const ch of this.#ceilingDistancesSubject.value) {
      ch.toggleVisibility(show)
    }
  }

  lookAt(anno: CeilingHeightAnnotation) {
    this.#canvasService.lookAt(anno.worldPoint);
  }

  deleteCeilingHeights(annos: readonly CeilingHeightAnnotation[]) {
    const set = new Set(annos);
    this.#modelManager.removeAnnotations(set);

    // when updating the subject, need to be sure we don't remove unsuccessful ones
    const newCeilingHeightsSubjectList = this.#ceilingDistancesSubject.value
      .filter(anno => !annos.includes(anno) || set.has(anno));

    this.#ceilingDistancesSubject.next(Object.freeze(
      newCeilingHeightsSubjectList,
    ));

    return (set.size === 0);
  }

  changeMode(mode: RaycastDistanceMode) {
    if (!(mode in RaycastDistanceMode)) {
      throw new Error(`Invalid mode ${mode}`);
    }
    this.#modeSubject.next(mode);
  }

  override start(): boolean {
    const event$ = this.#canvasService.eventOnRenderer('pointerdown');
    if (!event$) {
      console.error('Cannot start RaycastDistanceTool as there is no rendererTarget');
      return false;
    }

    this.#canvasService.enableControls(false);

    event$.pipe(
      takeUntil(this.#stopSubject),
      map(e => {
        console.info('e', e);
        e.preventDefault();
        const targetCoords = new Vector2(e.offsetX, e.offsetY);
        const dimensions = this.#canvasService.getRendererDimensions()!;

        const mouseWorldPos =
          targetCoords
            .divide(dimensions)
            .multiply(new Vector2(2, -2))
            .add(new Vector2(-1, 1));

        console.info({
          targetCoords,
          dimensions,
          mouseWorldPos,
        });

        const results = this.#canvasService.raycastFromCamera(mouseWorldPos);

        switch (this.#modeSubject.value) {
          case RaycastDistanceMode.fromCamera:
            this.#handleCameraRaycast(results);
            break;
          case RaycastDistanceMode.ceiling:
            this.#handleCeilingRaycast(results);
            break;
        }
      })
    ).subscribe();
    return true;
  }

  override stop(): boolean {
    this.#stopSubject.next();

    this.#canvasService.enableControls(true);

    return true;
  }

  #handleCameraRaycast(results: Intersection<Object3D>[]) {
    const output: IRaycastCameraDistance[] = [];

    const firstGridHelper = results.find(r => r.object instanceof GridHelper);
    const girdHelperDistFromCamera = firstGridHelper?.distance ?? Infinity;

    for (const result of results) {
      // we only want to add the first GridHelper to the list
      if (result.object instanceof GridHelper && result !== firstGridHelper) {
        continue;
      }

      let type: IRaycastCameraDistance['type'] = null;
      if (result.object instanceof GridHelper) {
        type = 'GridHelper';
      } else if (result.object instanceof Mesh) {
        type = 'Mesh';
      }

      output.push({
        cameraDistance: result.distance,
        gridDistance: girdHelperDistFromCamera - result.distance,
        absPoint: result.point,
        type,
        firstParentGroup: this.#getFirstParentGroup(result.object),
      });
    }

    this.#cameraDistancesSubject.next(output);
  }
  #handleCeilingRaycast(results: Intersection<Object3D>[]) {
    const firstMeshInter = results.find((r): r is Intersection<Mesh> => r.object instanceof Mesh);
    if (!firstMeshInter) {
      console.info('no mesh intersected by raycast', results);
      return false;
    }

    const {
      point: floorPoint,
      object,
    } = firstMeshInter;

    const firstParentGroup = this.#getFirstParentGroup(object);

    if (!firstParentGroup) {
      console.warn('Could not find a parent group?', object);
      return null;
    }

    const upIntersections = this.#canvasService.raycast(floorPoint, new Vector3(0, 1, 0));

    const firstMeshCeiling = upIntersections.find((r): r is Intersection<Mesh> => r.object instanceof Mesh);

    if (!firstMeshCeiling) {
      console.warn('No ceiling');
      return null;
    }

    const ceilingPoint = firstMeshCeiling.point;

    const floorPointRelativeToParent = firstParentGroup.worldToLocal(floorPoint.clone());
    const distance = floorPoint.distanceTo(ceilingPoint);

    const anno = new CeilingHeightAnnotation(
      Date.now().toString(),
      floorPointRelativeToParent,
      distance,
      (valueInMeters, digitsInfo) => formatLength(this.#settings.measurementSystem, this.#localeId, valueInMeters, digitsInfo),
    );

    this.#modelManager.addAnnotationToGroup(anno, firstParentGroup);

    const newList = Object.freeze([
      ...this.#ceilingDistancesSubject.value,
      anno,
    ]);

    this.#ceilingDistancesSubject.next(newList);
    return true;
  }

  #getFirstParentGroup(item: Object3D): Group | null {
    if (item instanceof Group) {
      return item;
    }
    if (item.parent) {
      return this.#getFirstParentGroup(item.parent);
    }
    return null;
  }
}
