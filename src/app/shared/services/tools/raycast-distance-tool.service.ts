import { Injectable, inject } from '@angular/core';
import { BaseToolService } from './base-tool.service';
import { BehaviorSubject, Subject, map, takeUntil } from 'rxjs';
import { CanvasService } from '../canvas.service';
import { GridHelper, Group, Intersection, Mesh, Object3D, Vector2, Vector3 } from 'three';

interface IRaycastDistance {
  readonly cameraDistance: number;
  readonly gridDistance: number;
  readonly point: Readonly<Vector3>;
  readonly onFrontFace: boolean | null;
  readonly type: 'Mesh' | 'GridHelper' | null;
  readonly firstParentGroupName: string | null;
}

@Injectable()
export class RaycastDistanceToolService extends BaseToolService {
  readonly #canvasService = inject(CanvasService);
  readonly #stopSubject = new Subject<void>();
  readonly #distancesSubject = new BehaviorSubject<readonly IRaycastDistance[]>([]);

  readonly distances$ = this.#distancesSubject.asObservable();

  override readonly id = 'raycast-distance';
  override readonly label = 'Raycast distance';
  override readonly icon = 'biotech';

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

        const handledResults = this.#handleResults(results);
        console.info('raycast results', results, handledResults);

        const firstMesh = handledResults.find(r => r.type === 'Mesh');
        if (firstMesh) {
          const upResults = this.#canvasService.raycast(firstMesh.point, new Vector3(0, 1, 0));
          console.info('raycast UP results', upResults);
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


  #handleResults(results: Intersection<Object3D>[]) {
    const output: IRaycastDistance[] = [];

    const firstGridHelper = results.find(r => r.object instanceof GridHelper);
    const girdHelperDistFromCamera = firstGridHelper?.distance ?? Infinity;

    for (const result of results) {
      // we only want to add the first GridHelper to the list
      if (result.object instanceof GridHelper && result !== firstGridHelper) {
        continue;
      }

      let type: IRaycastDistance['type'] = null;
      if (result.object instanceof GridHelper) {
        type = 'GridHelper';
      } else if (result.object instanceof Mesh) {
        type = 'Mesh';
      }

      output.push({
        cameraDistance: result.distance,
        gridDistance: girdHelperDistFromCamera - result.distance,
        onFrontFace: null,
        point: result.point,
        type,
        firstParentGroupName: this.#getFirstParentGroupName(result.object),
      });
    }

    return output;
  }

  #getFirstParentGroupName(item: Object3D): string | null {
    if (item instanceof Group) {
      return item.name;
    }
    if (item.parent) {
      return this.#getFirstParentGroupName(item.parent);
    }
    return null;
  }
}
