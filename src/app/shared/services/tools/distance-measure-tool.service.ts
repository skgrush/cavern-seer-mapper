import { Injectable, inject } from '@angular/core';
import { BaseToolService } from './base-tool.service';
import { CanvasService } from '../canvas.service';
import { BehaviorSubject, Subject, distinctUntilChanged, map, of, take, takeUntil, tap } from 'rxjs';
import { Group, Intersection, Mesh, Object3D, Vector2, Vector3 } from 'three';
import { MeasureDistanceAnnotation } from '../../models/annotations/measure-distance.annotation';
import { ModelManagerService } from '../model-manager.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnnotationBuilderService } from '../annotation-builder.service';
import { ignoreNullish } from '../../operators/ignore-nullish';
import { IMapperUserData } from '../../models/user-data';

@Injectable()
export class DistanceMeasureToolService extends BaseToolService {
  readonly #canvasService = inject(CanvasService);
  readonly #modelManager = inject(ModelManagerService);
  readonly #annotationBuilder = inject(AnnotationBuilderService);
  readonly #stopSubject = new Subject<void>();

  readonly #measuresSubject = new BehaviorSubject<readonly MeasureDistanceAnnotation[]>([]);
  readonly measures$ = this.#measuresSubject.asObservable();

  readonly #selectedMeasureSubject = new BehaviorSubject<MeasureDistanceAnnotation | undefined>(undefined);
  readonly selectedMeasure$ = this.#selectedMeasureSubject.asObservable();

  readonly #showMeasuresSubject = new BehaviorSubject(true);

  override readonly id = 'distance';
  override readonly label = 'Distance measure';
  override readonly icon = 'square_foot';
  override readonly cursor$ = of('crosshair');

  constructor() {
    super();

    this.#modelManager.currentOpenGroup$.pipe(
      takeUntilDestroyed(),
      distinctUntilChanged(),
      tap(group => {
        // when the group changes, pull all the annotations out and put them in the subject
        const annos = group
          ?.getAllAnnotationsRecursively()
          .filter((anno): anno is MeasureDistanceAnnotation => anno instanceof MeasureDistanceAnnotation)
          ?? [];
        this.#measuresSubject.next(Object.freeze(annos));
      }),
    ).subscribe();
  }

  toggleMeasureVisibility(show: boolean) {
    if (show === this.#showMeasuresSubject.value) {
      return;
    }
    this.#showMeasuresSubject.next(show);
    for (const ch of this.#measuresSubject.value) {
      ch.toggleVisibility(show)
    }
  }

  selectMeasure(measure?: MeasureDistanceAnnotation) {
    if (measure && !this.#measuresSubject.value.includes(measure)) {
      console.error('error context', { measure, known: this.#selectedMeasureSubject.value });
      throw new Error('Unknown measure selected');
    }
    this.#selectedMeasureSubject.next(measure);
  }

  renameMeasure(measure: MeasureDistanceAnnotation, newIdentifier: string) {
    if (measure !== this.#selectedMeasureSubject.value) {
      throw new Error('cannot rename unselected measure');
    }
    measure.rename(newIdentifier);
    this.#measuresSubject.next(this.#measuresSubject.value);
    this.#selectedMeasureSubject.next(measure);
  }

  measureRenameIsValid(oldName: string, newName: string) {
    for (const measure of this.#measuresSubject.value) {
      if (measure.identifier === oldName) {
        continue;
      }
      if (measure.identifier === newName) {
        return false;
      }
    }
    return true;
  }

  deleteMeasure(measure: MeasureDistanceAnnotation) {
    this.#modelManager.removeAnnotations(new Set([measure]));

    const newSubjectList = this.#measuresSubject.value
      .filter(anno => anno !== measure);

    if (this.#selectedMeasureSubject.value === measure) {
      this.#selectedMeasureSubject.next(undefined);
    }
    this.#measuresSubject.next(Object.freeze(newSubjectList));
  }

  deletePointsFromMeasure(
    measure: MeasureDistanceAnnotation,
    points: readonly Vector3[],
  ) {
    if (measure !== this.#selectedMeasureSubject.value) {
      throw new Error('Can only deletePointsFromMeasure() from the selected measure');
    }

    measure.deletePoints(points);
    this.#selectedMeasureSubject.next(measure);
  }

  lookAtAnno(anno: MeasureDistanceAnnotation) {
    this.#canvasService.lookAt(anno.worldPoint);
  }

  lookAt(localPoint: Vector3) {
    this.#selectedMeasureSubject.pipe(
      ignoreNullish(),
      take(1),
      tap(measure => {
        this.#canvasService.lookAt(measure.localToWorld(localPoint));
      })
    ).subscribe();
  }

  override start(): boolean {

    const event$ = this.#canvasService.eventOnRenderer('pointerdown');
    if (!event$) {
      console.error('Cannot start DistanceMeasureTool as there is no rendererTarget');
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

        const mouseWorldPos = this.normalizeCanvasCoords(targetCoords, dimensions);

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
    const firstMesh = casts.find((cast): cast is Intersection<Mesh> => cast.object instanceof Mesh);

    if (!firstMesh) {
      console.info('no mesh intersected by raycast', casts);
      return;
    }

    const {
      point,
      object,
    } = firstMesh;

    const firstParentGroup = this.#getFirstParentGroup(object);

    if (!firstParentGroup) {
      console.warn('Could not find a parent group?', object);
      return;
    }

    const userMapperData = (firstParentGroup.userData as IMapperUserData);
    if (!userMapperData.fromSerializedModel || userMapperData.isAnnotationGroup) {
      console.warn('First parent group is not a serialized mesh group', firstParentGroup);
    }

    if (this.#selectedMeasureSubject.value) {
      const selectedMeasure = this.#selectedMeasureSubject.value;

      selectedMeasure.addNewWorldPoint(point);

      this.#selectedMeasureSubject.next(selectedMeasure);
    } else {
      const pointRelativeToParent = firstParentGroup.worldToLocal(point.clone());

      // if there is no current selected measure, make one!
      const newSelectedMeasure = this.#annotationBuilder.buildMeasureDistance(
        Date.now().toString(),
        pointRelativeToParent,
        [],
      );
      this.#measuresSubject.next(Object.freeze([
        ...this.#measuresSubject.value,
        newSelectedMeasure,
      ]));

      this.#modelManager.addAnnotationToGroup(newSelectedMeasure, firstParentGroup);

      this.#selectedMeasureSubject.next(newSelectedMeasure);
    }

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
