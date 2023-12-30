import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Subject, distinctUntilChanged, filter, merge, switchMap, takeUntil, tap } from 'rxjs';
import { BufferGeometry, GridHelper, Intersection, Line, LineBasicMaterial, Vector2, Vector3 } from 'three';
import { CrossSectionAnnotation } from '../../models/annotations/cross-section.annotation';
import { TemporaryAnnotation } from '../../models/annotations/temporary.annotation';
import { GroupRenderModel } from '../../models/render/group.render-model';
import { RenderingOrder } from '../../models/rendering-layers';
import { AnnotationBuilderService } from '../annotation-builder.service';
import { CanvasService } from '../canvas.service';
import { ModelManagerService } from '../model-manager.service';
import { BaseExclusiveToolService } from './base-tool.service';

@Injectable()
export class CrossSectionToolService extends BaseExclusiveToolService {
  readonly #canvasService = inject(CanvasService);
  readonly #modelManager = inject(ModelManagerService);
  readonly #annoBuilder = inject(AnnotationBuilderService);

  readonly normalCursor = 'pointer';
  readonly movingCursor = 'col-resize';

  readonly #cursor = new BehaviorSubject<'pointer' | 'col-resize'>(this.normalCursor);
  readonly #stopSubject = new Subject<void>();

  readonly #crossSectionsSubject = new BehaviorSubject<readonly CrossSectionAnnotation[]>([]);
  readonly crossSections$ = this.#crossSectionsSubject.asObservable();

  readonly #selectedSubject = new BehaviorSubject<CrossSectionAnnotation | null>(null);
  readonly selected$ = this.#selectedSubject.asObservable();

  readonly #visibilitySubject = new BehaviorSubject<boolean>(true);
  readonly visibility$ = this.#visibilitySubject.asObservable();

  override readonly id = 'cross-section';
  override readonly label = 'Cross section';
  override readonly icon = 'looks';
  override readonly cursor$ = this.#cursor.pipe(distinctUntilChanged());

  #currentModelRef?: WeakRef<GroupRenderModel>;
  #preview?: {
    origin: Vector3;
    dest: Vector3;
    lineAnno: TemporaryAnnotation<Line>;
  }

  constructor() {
    super();

    this.#modelManager.currentOpenGroup$.pipe(
      takeUntilDestroyed(),
      distinctUntilChanged(),
    ).subscribe(group => {
      const annos = group
        ?.getAllAnnotationsRecursively()
        .filter((anno): anno is CrossSectionAnnotation => anno instanceof CrossSectionAnnotation)
        ?? [];

      this.#crossSectionsSubject.next(Object.freeze(annos));
      if (this.#selectedSubject.value && !annos.includes(this.#selectedSubject.value)) {
        this.#selectedSubject.next(null);
      }
    })
  }

  selectCrossSection(selected: CrossSectionAnnotation | null) {
    this.#selectedSubject.next(selected);
  }

  changeCrossSectionPosition(cs: CrossSectionAnnotation, position: Vector3) {
    cs.changeCenterPoint(position);
  }
  changeCrossSectionDimensions(cs: CrossSectionAnnotation, dimensions: Vector3) {
    cs.changeDimensions(dimensions);
  }
  changeCrossSectionRotation(cs: CrossSectionAnnotation, angleDegrees: number) {
    cs.changeRotation(angleDegrees);
  }

  deleteCrossSection(annos: readonly CrossSectionAnnotation[]) {
    const set = new Set(annos);
    this.#modelManager.removeAnnotations(set);

    const newCrossSectionSubjectList = this.#crossSectionsSubject.value
      .filter(anno => !annos.includes(anno) || set.has(anno));

    this.#crossSectionsSubject.next(Object.freeze(
      newCrossSectionSubjectList,
    ));

    if (annos.includes(this.#selectedSubject.value!)) {
      this.#selectedSubject.next(null);
    }

    return (set.size === 0);
  }

  renameCrossSection(anno: CrossSectionAnnotation, newIdentifier: string) {
    anno.rename(newIdentifier);
    this.#crossSectionsSubject.next(this.#crossSectionsSubject.value);
  }

  crossSectionRenameIsValid(oldName: string, newName: string) {
    for (const anno of this.#crossSectionsSubject.value) {
      if (anno.identifier === oldName) {
        continue;
      }

      if (anno.identifier === newName) {
        return false;
      }
    }
    return true;
  }

  lookAt(anno: CrossSectionAnnotation) {
    this.#canvasService.lookAt(anno.anchorPoint);
  }

  toggleVisibility(show: boolean) {
    this.#visibilitySubject.next(show);
    for (const cs of this.#crossSectionsSubject.value) {
      cs.toggleVisibility(show);
    }
  }

  override start(): boolean {

    this.#modelManager.currentOpenGroup$.pipe(
      takeUntil(this.#stopSubject),
    ).subscribe(group => {
      this.#currentModelRef = group
        ? new WeakRef(group)
        : undefined;
    })

    const pointerDown$ = this.#canvasService.eventOnRenderer('pointerdown');

    if (!pointerDown$) {
      console.error('Cannot start CrossSectionTool as there is no rendererTarget');
      return false;
    }

    const pointerUp$ = this.#canvasService.eventOnRenderer('pointerup')!;
    const pointerMove$ = this.#canvasService.eventOnRenderer('pointermove')!;
    const pointerCancel$ = this.#canvasService.eventOnRenderer('pointercancel')!;
    const pointerLeave$ = this.#canvasService.eventOnRenderer('pointerleave')!;
    const keyCancel$ = this.#canvasService.eventOnRenderer('keyup')!.pipe(
      filter(e => e.code === 'Escape'),
    );

    this.#canvasService.enableControls(false);

    const cancel$ = merge(
      pointerCancel$,
      pointerLeave$,
      keyCancel$,
    ).pipe(tap(() => {
      this.#cursor.next(this.normalCursor);
      this.#cancelDraw();
    }));

    const start$ = pointerDown$.pipe(
      filter(() => !this.#preview),
      tap(e => {
        this.#cursor.next(this.movingCursor);

        const coord = this.#pointerEventToGridCoordinate(e);
        if (coord) {
          this.#drawLine(coord);
        }
      }),
    );

    const move$ = pointerMove$.pipe(
      tap(moveEvent => {
        const coord = this.#pointerEventToGridCoordinate(moveEvent);
        if (coord) {
          this.#drawLine(coord);
        }
      }),
    );
    const finish$ = pointerUp$.pipe(
      tap(upEvent => {
        this.#cursor.next(this.normalCursor);

        const coord = this.#pointerEventToGridCoordinate(upEvent);
        if (coord) {
          this.#drawLine(coord);
        }

        const preview = this.#preview;
        const group = this.#currentModelRef?.deref();
        if (!preview) {
          throw new Error('missing preview??');
        }
        if (!group) {
          throw new Error('missing group??');
        }

        const { origin, dest } = preview;

        const crossSection = this.#annoBuilder.buildCrossSectionFromCrosslineAndBoundingBox(
          Date.now().toString(),
          origin,
          dest,
          1,
          group.getBoundingBox(),
        );

        group.addAnnotation(crossSection);

        this.#crossSectionsSubject.next(Object.freeze([
          ...this.#crossSectionsSubject.value,
          crossSection,
        ]));

        // clean up
        this.#cancelDraw();
      }),
    );

    // do the events!
    start$.pipe(
      takeUntil(this.#stopSubject),
      switchMap(e => {
        // take move events until finishing or cancelling.
        // should NOT be inlined, as we don't want to cut off down events.
        return move$.pipe(
          takeUntil(finish$),
          takeUntil(cancel$),
        );
      }),
    ).subscribe();

    return true;
  }

  override stop(): boolean {
    this.#stopSubject.next();
    this.#cancelDraw();

    this.#canvasService.enableControls(true);

    return true;
  }

  #cancelDraw() {
    const preview = this.#preview;
    const group = this.#currentModelRef?.deref();
    if (!preview) {
      return;
    }

    group?.removeAnnotations(new Set([preview.lineAnno]));
    this.#preview = undefined;
  }

  #pointerEventToGridCoordinate(e: PointerEvent) {
    const targetCoords = new Vector2(e.offsetX, e.offsetY);
    const dimensions = this.#canvasService.getRendererDimensions()!;

    const mouseWorldPos = this.normalizeCanvasCoords(targetCoords, dimensions);

    const casts = this.#canvasService.raycastFromCamera(mouseWorldPos);

    const firstGridCast = casts.find((cast): cast is Intersection<GridHelper> => cast.object instanceof GridHelper);

    return firstGridCast?.point;
  }

  #drawLine(destPoint: Vector3, startPoint?: Vector3) {
    if (this.#preview) {
      this.#preview.origin = startPoint ?? this.#preview.origin;
      this.#preview.dest = destPoint;

      this.#preview.lineAnno.object.geometry.setFromPoints([
        this.#preview.origin,
        this.#preview.dest,
      ]);

    } else {
      const group = this.#currentModelRef?.deref();
      if (!group) {
        throw new Error('Missing currentModelRef while trying to draw line');
      }

      startPoint ??= destPoint;

      const material = new LineBasicMaterial({ color: 0xFFFFFF });
      const geometry = new BufferGeometry().setFromPoints([
        startPoint,
        destPoint,
      ]);
      // create the line
      const line = new Line(
        geometry,
        material,
      );
      material.depthTest = false;
      line.renderOrder = RenderingOrder.Annotation;

      const lineAnno = new TemporaryAnnotation<Line>(
        'cross section preview line',
        line,
        l => this.#preview?.origin ?? new Vector3(),
      );
      this.#preview = {
        origin: startPoint,
        dest: destPoint,
        lineAnno,
      };



      group.addAnnotation(lineAnno);
    }
  }
}
