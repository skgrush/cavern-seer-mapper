import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, distinctUntilChanged, map, of, Subject, takeUntil } from 'rxjs';
import { Group, Intersection, Mesh, Object3D, Vector2, Vector3 } from 'three';
import { CeilingHeightAnnotation } from '../../models/annotations/ceiling-height.annotation';
import { IMapperUserData } from '../../models/user-data';
import { AnnotationBuilderService } from '../annotation-builder.service';
import { CanvasService } from '../canvas.service';
import { ModelManagerService } from '../model-manager.service';
import { BaseExclusiveToolService } from './base-tool.service';
import { AlertService, AlertType } from '../alert.service';

@Injectable()
export class CeilingHeightToolService extends BaseExclusiveToolService {
  readonly #canvasService = inject(CanvasService);
  readonly #modelManager = inject(ModelManagerService);
  readonly #annotationBuilder = inject(AnnotationBuilderService);
  readonly #alertService = inject(AlertService);

  readonly #stopSubject = new Subject<void>();

  readonly #ceilingDistancesSubject = new BehaviorSubject<readonly CeilingHeightAnnotation[]>([]);
  readonly #showCeilingHeightsSubject = new BehaviorSubject(true);

  readonly ceilingDistances$ = this.#ceilingDistancesSubject.asObservable();
  readonly showCeilingHeights$ = this.#showCeilingHeightsSubject.asObservable();

  override readonly id = 'ceiling-height';
  override readonly label = 'Ceiling height';
  override readonly icon$ = of({ icon: 'biotech' });
  override readonly cursor$ = of('crosshair');

  constructor() {
    super();

    this.#modelManager.currentOpenGroup$.pipe(
      takeUntilDestroyed(),
      distinctUntilChanged(),
    ).subscribe(group => {
      // when the group changes, pull all the annotations out and put them in the subject
      const annos = group
        ?.getAllAnnotationsRecursively()
        .filter((anno) => anno instanceof CeilingHeightAnnotation)
        ?? [];
      this.#ceilingDistancesSubject.next(Object.freeze(annos));
    });
  }

  toggleCeilingHeights(show: boolean) {
    if (show === this.#showCeilingHeightsSubject.value) {
      return;
    }
    this.#showCeilingHeightsSubject.next(show);
    for (const ch of this.#ceilingDistancesSubject.value) {
      ch.toggleVisibility(show);
    }
  }

  lookAt(anno: CeilingHeightAnnotation) {
    this.#canvasService.lookAt(anno.worldPoint);
  }

  renameCeilingHeight(anno: CeilingHeightAnnotation, newIdentifier: string) {
    anno.rename(newIdentifier);
    this.#ceilingDistancesSubject.next(this.#ceilingDistancesSubject.value);
  }

  ceilingHeightRenameIsValid(oldName: string, newName: string) {
    for (const anno of this.#ceilingDistancesSubject.value) {
      if (anno.identifier === oldName) {
        continue;
      }
      if (anno.identifier === newName) {
        return false;
      }
    }
    return true;
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

  override start(): boolean {
    const event$ = this.#canvasService.eventOnRenderer('pointerdown');
    if (!event$) {
      console.error('Cannot start CeilingHeightTool as there is no rendererTarget');
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

        this.#handleCeilingRaycast(results);
      })
    ).subscribe();
    return true;
  }

  override stop(): boolean {
    this.#stopSubject.next();

    this.#canvasService.enableControls(true);

    return true;
  }

  #handleCeilingRaycast(results: Intersection<Object3D>[]) {
    const firstMeshInter = results.find((r): r is Intersection<Mesh> => r.object instanceof Mesh);
    if (!firstMeshInter) {
      this.#alertService.alert(AlertType.warning, 'No mesh found');
      console.info('no mesh intersected by raycast', results);
      return false;
    }

    const {
      point: floorPoint,
      object,
    } = firstMeshInter;

    const firstParentGroup = this.#getFirstParentGroup(object);

    if (!firstParentGroup) {
      this.#alertService.alert(AlertType.warning, 'No layer found');
      console.warn('Could not find a parent group?', object);
      return null;
    }

    const userMapperData = (firstParentGroup.userData as IMapperUserData);
    if (!userMapperData.fromSerializedModel || userMapperData.isAnnotationGroup) {
      console.warn('First parent group is not a serialized mesh group', firstParentGroup);
    }

    const upIntersections = this.#canvasService.raycast(floorPoint, new Vector3(0, 1, 0));

    const firstMeshCeiling = upIntersections.find((r): r is Intersection<Mesh> => r.object instanceof Mesh);

    if (!firstMeshCeiling) {
      this.#alertService.alert(AlertType.warning, 'No ceiling height');
      return null;
    }

    const ceilingPoint = firstMeshCeiling.point;

    const floorPointRelativeToParent = firstParentGroup.worldToLocal(floorPoint.clone());
    const distance = floorPoint.distanceTo(ceilingPoint);

    const anno = this.#annotationBuilder.buildCeilingHeight(
      Date.now().toString(),
      floorPointRelativeToParent,
      distance,
    );

    this.#modelManager.addAnnotationToGroup(anno, firstParentGroup);

    const newList = Object.freeze([
      anno,
      ...this.#ceilingDistancesSubject.value,
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
