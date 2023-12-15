import { Injectable, inject } from '@angular/core';
import { BaseToolService } from './base-tool.service';
import { CanvasService } from '../canvas.service';
import { Subject, map, takeUntil } from 'rxjs';
import { Mesh, Vector2, Vector3 } from 'three';

@Injectable()
export class MeasureToolService extends BaseToolService {
  readonly #canvasService = inject(CanvasService);
  readonly #stopSubject = new Subject<void>();

  #previousPoint?: Vector3;
  #currentPoint?: Vector3;

  override readonly id = 'measure';
  override readonly label = 'Measure';
  override readonly icon = 'square_foot';

  override start(): boolean {

    const event$ = this.#canvasService.eventOnRenderer('pointerdown');
    if (!event$) {
      console.error('Cannot start MeasureTool as there is no rendererTarget');
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

        this.#handleNewMeasurementLocation(mouseWorldPos);
      })
    ).subscribe();
    return true;
  }
  override stop(): boolean {
    this.#stopSubject.next();

    this.#canvasService.enableControls(true);

    return true;
  }

  #handleNewMeasurementLocation(mouseWorldPosition: Vector2) {
    const casts = this.#canvasService.raycastFromCamera(mouseWorldPosition);
    const firstMesh = casts.find(cast => cast.object instanceof Mesh);

    if (!firstMesh) {
      return;
    }

    this.#previousPoint = this.#currentPoint;
    this.#currentPoint = firstMesh.point;

    if (this.#currentPoint && this.#previousPoint) {
      console.info({
        current: this.#currentPoint,
        previous: this.#previousPoint,
        distance: this.#currentPoint.distanceTo(this.#previousPoint),
      });
    }
  }
}
