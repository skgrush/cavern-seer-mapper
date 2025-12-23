import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  animationFrames,
  BehaviorSubject,
  combineLatest,
  defer,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  Observable,
  of,
  scan,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import {
  AmbientLight,
  Box3,
  Camera,
  Clock,
  DirectionalLight,
  GridHelper,
  Intersection,
  OrthographicCamera,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { markSceneOfItemForReRender } from '../functions/mark-scene-of-item-for-rerender';
import { traverseSome } from '../functions/traverse-some';
import { ModelChangeType } from '../models/model-change-type.enum';
import { ControlViewHelper } from '../models/objects/control-view-helper';
import { OrthographicMapControls } from '../models/objects/orthographic-map-controls';
import { GroupRenderModel } from '../models/render/group.render-model';
import { IMapperUserData } from '../models/user-data';
import { ignoreNullish } from '../operators/ignore-nullish';
import { LocalizeService } from './localize.service';
import { ModelManagerService } from './model-manager.service';
import { SettingsService } from './settings/settings.service';
import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer.js';
import { TemporaryAnnotation } from '../models/annotations/temporary.annotation';
import { MaterialManagerService } from './materials/material-manager.service';
import { ElevationMaterialService } from './materials/elevation-material.service';
import { temporarilySet$ } from '../functions/temporarily-set';

@Injectable()
export class CanvasService {

  readonly #modelManager = inject(ModelManagerService);
  readonly #materialManager = inject(MaterialManagerService);
  readonly #localize = inject(LocalizeService);
  readonly #settings = inject(SettingsService);

  readonly #elevationMaterial = inject(ElevationMaterialService);

  readonly #renderClock = new Clock();
  readonly #scene = new Scene();
  readonly #raycaster = new Raycaster();

  readonly #mainRendererSymbol = Symbol('main-renderer');

  #mainRenderer?: WebGLRenderer;
  /** Emits any time the renderer is created or destroyed. */
  readonly #rendererChangedSubject = new Subject<void>();

  /**
   * Map of WeakRefs to known renderers, keyed by symbols.
   */
  readonly #rendererMap = new Map<symbol, WeakRef<WebGLRenderer>>();

  #orthoControls?: OrthographicMapControls;

  readonly #compassDivSubject = new BehaviorSubject<HTMLElement | undefined>(undefined);
  #compass?: ControlViewHelper<OrthographicMapControls>;

  readonly #gridVisibleSubject = new BehaviorSubject(true);
  readonly gridVisible$ = this.#gridVisibleSubject.asObservable();

  readonly #embeddedAnnotationsVisibleSubject = new BehaviorSubject(true);
  readonly embeddedAnnotationsVisible$ = this.#embeddedAnnotationsVisibleSubject.asObservable();

  readonly #boundingBoxForBottomGrid$ = new BehaviorSubject<Box3>(new Box3(new Vector3(), new Vector3(1, 1, 1)));
  readonly #cameraTargetHeight$ = new BehaviorSubject<number>(0);

  #bottomGrid = new GridHelper();

  #currentGroupInScene?: GroupRenderModel;

  readonly canvasKeyEvent$ = this.#rendererChangedSubject.pipe(
    startWith(undefined),
    switchMap(() => this.eventOnRenderer('keyup') ?? of()),
  );

  readonly cameraHeightRelativeToBoundingBox$ = combineLatest({
    grid: this.#boundingBoxForBottomGrid$,
    camHeight: this.#cameraTargetHeight$,
  }).pipe(
    map(({ grid, camHeight }) => camHeight - grid.max.y),
  );

  constructor() {
    this.#modelManager.currentOpenGroup$.pipe(
      takeUntilDestroyed(),
      distinctUntilChanged(),
    ).subscribe(group => {
      // clean up the existing group if any
      this.#currentGroupInScene?.removeFromScene(this.#scene);
      this.#currentGroupInScene?.dispose();

      this.#currentGroupInScene = group;
      // if there's a group, update the scene
      if (group) {
        group.addToScene(this.#scene);
        group.setMaterial(this.#materialManager.currentMaterial);

        const bounds = group.getBoundingBox();

        this.#boundingBoxForBottomGrid$.next(bounds);
        this.#recenterCamera(bounds);
      }

      // regardless, update the renderer
      this.render();
    });

    this.#materialManager.currentMaterial$.pipe(
      takeUntilDestroyed(),
    ).subscribe(mat => {
      this.#currentGroupInScene?.setMaterial(mat);
      markSceneOfItemForReRender(this.#scene);
    });
    this.#materialManager.materialSide$.pipe(
      takeUntilDestroyed(),
    ).subscribe(() => {
      markSceneOfItemForReRender(this.#scene);
    });

    this.#boundingBoxForBottomGrid$.pipe(
      takeUntilDestroyed(),
    ).subscribe(boundingBox => {
      this.#elevationMaterial.updateRange(boundingBox.min.y, boundingBox.max.y);
    });

    const modelChangeRedrawBox =
      ModelChangeType.EntityAdded |
      ModelChangeType.EntityRemoved |
      ModelChangeType.PositionChanged;

    // react to changes to childOrPropertyChanged$
    this.#modelManager.currentOpenGroup$.pipe(
      ignoreNullish(),
      switchMap(
        group => group.childOrPropertyChanged$.pipe(
          filter(e => (e & modelChangeRedrawBox) !== 0),
          map(() => group),
        ),
      ),
      takeUntilDestroyed(),
    ).subscribe(cog => {
      this.#boundingBoxForBottomGrid$.next(cog.getBoundingBox());
    });

    this.gridVisible$.pipe(
      takeUntilDestroyed()
    ).subscribe(visible => {
      this.#bottomGrid.visible = visible;
      markSceneOfItemForReRender(this.#bottomGrid);
    });

    this.embeddedAnnotationsVisible$.pipe(
      takeUntilDestroyed(),
      switchMap(visible => this.#modelManager.currentOpenGroup$.pipe(map(cog => ({ cog, visible })))),
    ).subscribe(({ visible, cog }) => {
      cog?.getAllAnnotationsRecursively()
        .filter((anno) => anno instanceof TemporaryAnnotation)
        .forEach(anno => anno.toggleVisibility(visible));
      markSceneOfItemForReRender(this.#scene);
    });

    combineLatest({
      bounds: this.#boundingBoxForBottomGrid$,
      gridScale: this.#settings.gridScale$,
    })
    .pipe(
      takeUntilDestroyed(),
    ).subscribe(({ bounds, gridScale }) => {
      this.#rebuildBottomGrid(bounds, gridScale);
    });

    this.canvasKeyEvent$.pipe(
      takeUntilDestroyed(),
    ).subscribe(e => {
      console.info('keyup', e.key);
      switch (e.key) {
        case 'ArrowUp':
          return this.#adjustCameraOnY(1);
        case 'ArrowDown':
          return this.#adjustCameraOnY(-1);
      }
    });
  }

  #adjustCameraOnY(amount: number) {
    if (!this.#orthoControls) {
      throw new Error('adjustCameraOnY with no controls');
    }

    const { camera, target } = this.#orthoControls;
    const delta = new Vector3(0, amount, 0);
    this.changeCameraPosition(
      camera.position.clone().add(delta),
      target.clone().add(delta),
    );
  }

  /**
   * Look at this point using the same camera angle.
   */
  lookAt(point: Vector3) {
    if (!this.#orthoControls) {
      throw new Error('lookAt with no controls');
    }

    const cameraToOldPointVector = new Vector3();
    cameraToOldPointVector.subVectors(this.#orthoControls.camera.position, this.#orthoControls.target);

    const newCameraLoc = point.clone().add(cameraToOldPointVector);

    this.changeCameraPosition(newCameraLoc, point);
  }

  changeCameraPosition(camera: Vector3, target: Vector3) {
    if (!this.#orthoControls) {
      throw new Error('changeCameraPosition with no controls');
    }

    this.#orthoControls.camera.position.copy(camera);
    this.#orthoControls.target.copy(target);
    this.#orthoControls.update();
    this.#cameraTargetHeight$.next(target.y);
  }

  registerCompass(compassEle$: Observable<HTMLElement | undefined>) {
    compassEle$.subscribe({
      next: ele => this.#compassDivSubject.next(ele),
      complete: () => this.#compassDivSubject.next(undefined),
    });
  }

  toggleGridVisible() {
    this.#gridVisibleSubject.next(
      !this.#gridVisibleSubject.value,
    );
  }

  toggleEmbeddedAnnotationsVisible() {
    this.#embeddedAnnotationsVisibleSubject.next(
      !this.#embeddedAnnotationsVisibleSubject.value,
    );
  }

  temporarilySetEmbeddedAnnotations$(to: boolean) {
    return temporarilySet$(this.#embeddedAnnotationsVisibleSubject, to);
  }

  /**
   * Export a blob of the canvas to the given type.
   *
   * @param type - the export type
   * @param sym - the symbol of the renderer to use
   * @param cam - which camera to use
   * @param sizeMultiplier - how to scale the image
   * @param quality - the lossy quality of the image
   *
   * @throws Error if the renderer or camera are not ready.
   */
  async exportToImage(
    type: `image/${string}`,
    sym = this.#mainRendererSymbol,
    cam?: Camera,
    sizeMultiplier = 1,
    quality?: number,
  ) {

    const renderer = this.#rendererMap.get(sym)?.deref();

    const dimensions = this.getRendererDimensions(sym);
    if (!renderer?.domElement || !dimensions) {
      throw new Error('Renderer or canvas not ready to export');
    }
    if (quality !== undefined && (quality < 0 || quality > 1)) {
      throw new RangeError(`quality must be between [0, 1]; got ${quality}`);
    }

    const { x: width, y: height } = dimensions.multiplyScalar(sizeMultiplier);

    const sceneCopy = this.#scene.clone(true);
    const camera = cam ?? this.#orthoControls?.camera;

    if (!camera) {
      throw new Error('Could not find camera in sceneCopy');
    }

    const canvas = new OffscreenCanvas(width, height);
    const tempRenderer = new WebGLRenderer({
      canvas,
      preserveDrawingBuffer: true,
      antialias: true,
      alpha: true,
    });

    // set the size but without setting styles, as OffscreenCanvas has no style
    tempRenderer.setSize(width, height, false);
    // IF the image supports transparency, clear the background
    if (type !== 'image/jpeg') {
      tempRenderer.setClearColor(0xFFFFFF, 0);
    }

    tempRenderer.render(sceneCopy, camera);

    const blob = await canvas.convertToBlob({
      type,
      quality,
    });

    tempRenderer.dispose();

    return blob;
  }

  exportToSvg(
    sym = this.#mainRendererSymbol,
    cam?: Camera,
  ) {
    const dimensions = this.getRendererDimensions(sym);
    if (!dimensions) {
      throw new Error('Renderer or canvas not ready to export');
    }

    const camera = cam ?? this.#orthoControls?.camera;

    if (!camera) {
      throw new Error('Could not find camera');
    }

    const svgRenderer = new SVGRenderer();
    svgRenderer.setSize(dimensions.x, dimensions.y);
    svgRenderer.render(this.#scene, camera);
    const { render } = svgRenderer.info;

    const serializer = new XMLSerializer();
    return {
      renderInfo: render,
      blob: new Blob([
        '<?xml version="1.0" standalone="no"?>\r\n',
        serializer.serializeToString(svgRenderer.domElement),
      ], {
        type: 'image/svg+xml;charset=utf-8',
      }),
    }
  }

  cleanupRenderer() {
    const mainRenderer = this.#mainRenderer;
    if (!mainRenderer) {
      return;
    }

    this.#mainRenderer = undefined;
    this.#rendererChangedSubject.next();
    mainRenderer.dispose();
    mainRenderer.forceContextLoss();
  }

  getRendererDimensions(sym = this.#mainRendererSymbol) {
    const ele = this.#rendererMap.get(sym)?.deref()?.domElement;
    if (!ele) {
      return null;
    }
    return new Vector2(ele.width, ele.height);
  }

  /**
   * Get an event listener for the renderer target.
   * Cuts off if the renderer is disposed.
   *
   * @returns null if there is no renderer target.
   */
  eventOnRenderer<K extends keyof HTMLElementEventMap>(
    eventKey: K,
  ) {
    const ele = this.#mainRenderer?.domElement
    if (!ele) {
      return null;
    }
    return fromEvent<HTMLElementEventMap[K]>(ele, eventKey).pipe(
      takeUntil(this.#rendererChangedSubject),
    );
  }

  raycastFromCamera(coords: Vector2) {
    this.#raycaster.setFromCamera(coords, this.#orthoControls!.camera);

    return this.#raycaster.intersectObject(this.#scene);
  }

  raycast(origin: Vector3, direction: Vector3) {
    this.#raycaster.set(origin, direction);

    return this.#raycaster.intersectObject(this.#scene);
  }

  raycastWithPreparedRaycaster(raycaster: Raycaster, recursive?: boolean, optionalTarget?: Intersection[]) {
    return raycaster.intersectObject(this.#scene, recursive, optionalTarget);
  }

  enableControls(enable: boolean) {
    if (!this.#orthoControls) {
      return;
    }
    this.#orthoControls.enabled = enable;
  }

  /**
   * Resize the renderer and camera when the view changes.
   *
   * Does not change zoom or anything, is only for canvas resizing.
   *
   * If `updateStyle` is false, will not set the domElement's style width and height
   * (behavior inherited from {@link WebGLRenderer.setSize()}).
   */
  resize({ width, height }: { width: number, height: number }, updateStyle?: boolean) {
    if (!this.#mainRenderer || !this.#orthoControls) {
      throw new Error('Attempt to resize() with no renderer');
    }

    const cam = this.#orthoControls.camera;
    cam.left = - width / 2;
    cam.right = width / 2;
    cam.top = height / 2;
    cam.bottom = - height / 2;
    cam.updateProjectionMatrix();

    this.#mainRenderer.setSize(width, height, updateStyle);
    markSceneOfItemForReRender(this.#scene);
  }

  render$() {
    return animationFrames().pipe(
      takeUntil(this.#rendererChangedSubject),
      map(({ timestamp, elapsed }) => {
        const rendered = this.render();
      }),
    );
  }

  /**
   * If {@link markSceneOfItemForReRender} was used OR any scene descendant has {@link Object3D#matrixWorldNeedsUpdate}
   * then we will render the scene.
   *
   * (First internally checks if the compass needs to render too).
   */
  render() {
    if (!this.#mainRenderer || !this.#orthoControls || !this.#compass) { return false; }

    const delta = this.#renderClock.getDelta();
    const sceneUserData = (this.#scene.userData as IMapperUserData);

    if (this.#compass.animating) {
      this.#compass.update(delta);
      sceneUserData.needsReRender = true;
    }

    if (sceneUserData.needsReRender || traverseSome(this.#scene, o => o.matrixWorldNeedsUpdate)) {
      console.count('didRender');
      this.#mainRenderer.clear();
      this.#mainRenderer.render(this.#scene, this.#orthoControls.camera);
      this.#compass.render(this.#mainRenderer);

      sceneUserData.needsReRender = undefined;
    }

    return true;
  }

  setBgColor(bgColor: string) {
    if (!this.#mainRenderer) {
      throw new Error('Attempt to setBgColor() with no renderer');
    }

    this.#mainRenderer.setClearColor(bgColor);
  }

  #recenterCamera(bounds: Box3) {
    const y = bounds.max.y + 1;
    this.changeCameraPosition(
      // sliiightly offset the Z so we (should) always look from Z when resetting controls
      new Vector3(0, y + 1, 0.0000001),
      new Vector3(0, y, 0),
    );
  }

  #rebuildBottomGrid(bounds: Box3, gridScale: number) {
    console.info('rebuilding bounding box');
    this.#scene.remove(this.#bottomGrid);
    this.#bottomGrid.dispose();

    const sizeBox = new Vector3();
    bounds.getSize(sizeBox);
    const { min: boundsMin } = bounds;

    // create a grid
    const sizeX = sizeBox.x;
    const sizeZ = sizeBox.z;
    const size = Math.max(sizeX, sizeZ);

    const gridHelper = this.#bottomGrid = new GridHelper(size, this.#localize.metersToLocalLength(size) / gridScale);

    let xDelta = sizeX / 2;
    let zDelta = sizeZ / 2;

    // TODO: #9 https://github.com/skgrush/cavern-seer-mapper/issues/9
    // attempt to adjust the localized grid to be aligned with the localized coordinates
    if (!this.#localize.isMetric) {
      xDelta = this.#localize.localLengthToMeters(Math.round(this.#localize.metersToLocalLength(xDelta)));
      zDelta = this.#localize.localLengthToMeters(Math.round(this.#localize.metersToLocalLength(zDelta)));
    }

    gridHelper.visible = this.#gridVisibleSubject.value;
    gridHelper.position.set(
      boundsMin.x + xDelta,
      boundsMin.y,
      boundsMin.z + zDelta,
    );
    this.#scene.add(gridHelper);
  }

  /**
   * Initialize a sub-renderer which will animate as long as you are subscribed
   * and will be cleaned up when you unsubscribe.
   *
   * This is in the same scene as the main renderer.
   */
  initializeSubRenderer$(
    sym: symbol,
    canvas: HTMLCanvasElement,
    { width, height }: { width: number, height: number },
    camera: Camera,
  ) {
    return defer(() => {
      if (sym === this.#mainRendererSymbol) {
        throw new Error('Cannot initialize subrenderer with main renderer symbol');
      }
      if (this.#rendererMap.has(sym)) {
        console.warn('Attempt to re-render', sym, 'before previous was disposed');
      }

      const renderer = new WebGLRenderer({
        canvas,
      });
      this.#rendererMap.set(sym, new WeakRef(renderer));

      renderer.setSize(width, height);

      const subRender = () => {
        renderer.render(this.#scene, camera);
      };

      return animationFrames().pipe(
        tap({
          next: subRender,
          unsubscribe: () => {
            renderer.dispose();
            // stop (Chrome?) browsers from creating too many contexts
            renderer.forceContextLoss();
            this.#rendererMap.delete(sym);
          },
        }),
        map(() => renderer),
        distinctUntilChanged(), // don't emit on each animation frame!
      );
    });
  }

  initializeRenderer(
    canvas: HTMLCanvasElement,
    { width, height }: DOMRectReadOnly,
    pixelRatio: number,
  ) {
    this.cleanupRenderer();

    this.#mainRenderer = new WebGLRenderer({
      canvas,
    });
    this.#rendererMap.set(this.#mainRendererSymbol, new WeakRef(this.#mainRenderer));
    this.#mainRenderer.autoClear = false;

    this.#mainRenderer.outputColorSpace = SRGBColorSpace;

    const cam = new OrthographicCamera();
    this.#scene.add(cam);
    this.#orthoControls = new OrthographicMapControls(cam, canvas);
    this.resize({ width, height });

    // #TODO: #10: https://github.com/skgrush/cavern-seer-mapper/issues/10
    // // setting pixel ratio screws with raycasting??
    // this.#mainRenderer.setPixelRatio(pixelRatio);

    this.#scene.add(new AmbientLight(0x222222, Math.PI));
    this.#scene.add(new DirectionalLight(0xFFFFFF, 1));

    this.#rendererChangedSubject.next();

    this.#compassDivSubject.pipe(
      takeUntil(this.#rendererChangedSubject),
      map(ele => {
        if (!ele || !this.#orthoControls || !this.#mainRenderer?.domElement) {
          return undefined;
        }
        const compass = new ControlViewHelper(this.#orthoControls, this.#mainRenderer.domElement);
        ele.addEventListener('pointerup', e => compass.handleClick(e));
        this.#compass = compass;
        return compass;
      }),
      scan((oldComp, newComp) => {
        oldComp?.dispose();
        return newComp;
      }),
    ).subscribe();

    this.render();
  }
}
