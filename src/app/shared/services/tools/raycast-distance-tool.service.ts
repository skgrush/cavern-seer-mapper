import { Injectable, inject } from '@angular/core';
import { BaseToolService } from './base-tool.service';
import { BehaviorSubject, Subject, map, of, takeUntil } from 'rxjs';
import { CanvasService } from '../canvas.service';
import { GridHelper, Group, Intersection, Mesh, Object3D, Vector2, Vector3 } from 'three';

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
export type IRaycastCeilingDistance = {
  readonly floorPoint: Readonly<Vector3>;
  readonly ceilingPoint: Readonly<Vector3>;
  readonly distance: number;
  readonly firstParentGroup: Group | null;
}

@Injectable()
export class RaycastDistanceToolService extends BaseToolService {
  readonly #canvasService = inject(CanvasService);
  readonly #stopSubject = new Subject<void>();

  // TODO: maybe should move these into the main state that gets serialized
  readonly #cameraDistancesSubject = new BehaviorSubject<readonly IRaycastCameraDistance[]>([]);
  readonly #ceilingDistancesSubject = new BehaviorSubject<readonly IRaycastCeilingDistance[]>([]);
  readonly #modeSubject = new BehaviorSubject(RaycastDistanceMode.ceiling);

  readonly cameraDistances$ = this.#cameraDistancesSubject.asObservable();
  readonly ceilingDistances$ = this.#ceilingDistancesSubject.asObservable();
  readonly mode$ = this.#modeSubject.asObservable();

  override readonly id = 'raycast-distance';
  override readonly label = 'Raycast distance';
  override readonly icon = 'biotech';
  override readonly cursor$ = of('crosshair');

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

    const upIntersections = this.#canvasService.raycast(floorPoint, new Vector3(0, 1, 0));

    const firstMeshCeiling = upIntersections.find((r): r is Intersection<Mesh> => r.object instanceof Mesh);

    const ceilingPoint = firstMeshCeiling
      ? firstMeshCeiling.point
      : floorPoint.add(new Vector3(0, Infinity, 0));

    const newEntry: IRaycastCeilingDistance = {
      ceilingPoint,
      floorPoint,
      distance: ceilingPoint.distanceTo(floorPoint),
      firstParentGroup: this.#getFirstParentGroup(object)
    };

    const newList = Object.freeze([
      ...this.#ceilingDistancesSubject.value,
      newEntry,
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
