import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, Subject, animationFrames, defer, distinctUntilChanged, filter, fromEvent, map, scan, switchMap, takeUntil, tap } from 'rxjs';
import { AmbientLight, Box3, Camera, Clock, FrontSide, GridHelper, Material, OrthographicCamera, Raycaster, Scene, Side, Vector2, Vector3, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { ViewHelper } from 'three/examples/jsm/helpers/ViewHelper.js';
import { ModelChangeType } from '../models/model-change-type.enum';
import { GroupRenderModel } from '../models/render/group.render-model';
import { ignoreNullish } from '../operators/ignore-nullish';
import { BaseMaterialService } from './3d-managers/base-material.service';
import { MeshNormalMaterialService } from './3d-managers/mesh-normal-material.service';
import { ModelManagerService } from './model-manager.service';
import { LocalizeService } from './localize.service';

@Injectable()
export class CanvasService {

  readonly #modelManager = inject(ModelManagerService);
  readonly #localize = inject(LocalizeService);

  readonly #renderClock = new Clock();
  readonly #scene = new Scene();
  readonly #raycaster = new Raycaster();

  readonly rendererSymbol = Symbol('main-renderer');

  #renderer?: WebGLRenderer;
  /** Emits any time the renderer is created or destroyed. */
  readonly #rendererChangedSubject = new Subject<void>();

  /**
   * Map of WeakRefs to known renderers, keyed by symbols.
   */
  readonly #rendererMap = new Map<symbol, WeakRef<WebGLRenderer>>();

  #orthoCamera?: OrthographicCamera;
  #orthoControls?: MapControls;

  readonly #compassDivSubject = new BehaviorSubject<HTMLElement | undefined>(undefined);
  #compass?: ViewHelper;

  readonly #meshNormalMaterial = inject(MeshNormalMaterialService);
  #material: BaseMaterialService<Material> = this.#meshNormalMaterial;

  readonly #materialSideSubject = new BehaviorSubject<Side>(FrontSide);
  readonly materialSide$ = this.#materialSideSubject.asObservable();

  #bottomGrid = new GridHelper();

  #currentGroupInScene?: GroupRenderModel;

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
        group.setMaterial(this.#material);

        const bounds = group.getBoundingBox();

        this.#rebuildBottomGrid(bounds);
        this.#refocusCamera(bounds);
      }

      // regardless, update the renderer
      this.render();
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
    ).subscribe(cog => {
      const bounds = cog.getBoundingBox();
      this.#rebuildBottomGrid(bounds);
    });
  }

  /**
   * Look at this point using the same camera angle.
   */
  lookAt(point: Vector3) {
    if (!this.#orthoControls) {
      throw new Error('lookAt with no controls');
    }

    const cameraToOldPointVector = new Vector3();
    cameraToOldPointVector.subVectors(this.#orthoControls.object.position, this.#orthoControls.target);

    const newCameraLoc = point.clone().add(cameraToOldPointVector);

    this.#orthoControls.object.position.copy(newCameraLoc);
    this.#orthoControls.target.copy(point);
    this.#orthoControls.update();
  }

  registerCompass(compassEle$: Observable<HTMLElement | undefined>) {
    compassEle$.subscribe({
      next: ele => this.#compassDivSubject.next(ele),
      complete: () => this.#compassDivSubject.next(undefined),
    });
  }

  toggleDoubleSideMaterial() {
    this.#materialSideSubject.next(
      this.#material.toggleDoubleSide()
    );
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
    sym = this.rendererSymbol,
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
    const camera = cam ?? this.#orthoCamera;

    if (!camera) {
      throw new Error('Could not find camera in sceneCopy');
    }

    const canvas = new OffscreenCanvas(width, height);
    const tempRenderer = new WebGLRenderer({
      canvas,
      preserveDrawingBuffer: true,
      antialias: true,
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

  cleanupRenderer() {
    if (!this.#renderer) {
      return;
    }

    this.#rendererChangedSubject.next();
    this.#renderer.dispose();
    this.#renderer = undefined;
  }

  getRendererDimensions(sym = this.rendererSymbol) {
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
    const ele = this.#renderer?.domElement
    if (!ele) {
      return null;
    }
    return fromEvent<HTMLElementEventMap[K]>(ele, eventKey).pipe(
      takeUntil(this.#rendererChangedSubject),
    );
  }

  raycastFromCamera(coords: Vector2) {
    this.#raycaster.setFromCamera(coords, this.#orthoCamera!);

    return this.#raycaster.intersectObjects(this.#scene.children, true);
  }

  raycast(origin: Vector3, direction: Vector3) {
    this.#raycaster.set(origin, direction);

    return this.#raycaster.intersectObjects(this.#scene.children, true);
  }

  enableControls(enable: boolean) {
    if (!this.#orthoControls) {
      return;
    }
    this.#orthoControls.enabled = enable;
  }

  resize({ width, height }: DOMRectReadOnly) {
    if (!this.#renderer) {
      throw new Error('Attempt to resize() with no renderer');
    }

    const cam = this.#orthoCamera!;
    cam.left = - width / 2;
    cam.right = width / 2;
    cam.top = height / 2;
    cam.bottom = - height / 2;
    cam.updateProjectionMatrix();

    this.#renderer.setSize(width, height);
  }

  render$() {
    return animationFrames().pipe(
      takeUntil(this.#rendererChangedSubject),
      map(({ timestamp, elapsed }) => {
        const rendered = this.render();
      }),
    );
  }

  #wasAnimatingCompass = false;

  render() {
    if (!this.#renderer) { return false; }

    const delta = this.#renderClock.getDelta();

    if (this.#compass?.animating) {
      this.#compass.update(delta);
      this.#wasAnimatingCompass = true;
    } else {
      if (this.#wasAnimatingCompass) {
        // just finished animating
        // I CANNOT figure out why I can't just update controls, but I seem to need to rebuild
        this.#orthoControls?.dispose();
        this.#orthoControls = new MapControls(this.#orthoCamera!, this.#renderer.domElement);
      }

      this.#wasAnimatingCompass = false;
    }

    this.#renderer.clear();
    this.#renderer.render(this.#scene, this.#orthoCamera!);
    this.#compass?.render(this.#renderer);

    return true;
  }

  setBgColor(bgColor: string) {
    if (!this.#renderer) {
      throw new Error('Attempt to setBgColor() with no renderer');
    }

    this.#renderer.setClearColor(bgColor);
  }

  #refocusCamera(bounds: Box3) {
    const controls = this.#orthoControls;
    if (!controls) {
      console.error('missing controls/camera', this);
      return;
    }

    controls.object.position.set(
      0,
      bounds.max.y + 5,
      0.0000001 // sliiightly offset the Z so we (should) always look from Z when reseting controls
    );
    controls.target.set(0, 0, 0);

    controls.update();
  }

  #rebuildBottomGrid(bounds: Box3) {
    this.#scene.remove(this.#bottomGrid);
    this.#bottomGrid.dispose();

    const sizeBox = new Vector3();
    bounds.getSize(sizeBox);
    const { max: boundsMax, min: boundsMin } = bounds;

    // create a grid
    const sizeX = sizeBox.x;
    const sizeZ = sizeBox.z;
    const size = Math.max(sizeX, sizeZ);

    this.#scene.remove(this.#bottomGrid);
    const gridHelper = this.#bottomGrid = new GridHelper(size, this.#localize.metersToLocalLength(size));

    let xDelta = sizeX / 2;
    let zDelta = sizeZ / 2;

    // TODO: #9 https://github.com/skgrush/cavern-seer-mapper/issues/9
    // attempt to adjust the localized grid to be aligned with the localized coordinates
    if (!this.#localize.isMetric) {
      xDelta = this.#localize.localLengthToMeters(Math.round(this.#localize.metersToLocalLength(xDelta)));
      zDelta = this.#localize.localLengthToMeters(Math.round(this.#localize.metersToLocalLength(zDelta)));
    }

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
   */
  initializeSubRenderer$(
    sym: symbol,
    canvas: HTMLCanvasElement,
    { width, height }: { width: number, height: number },
    camera: Camera,
  ) {
    return defer(() => {
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
          unsubscribe: () => renderer.dispose(),
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

    this.#renderer = new WebGLRenderer({
      canvas,
    });
    this.#rendererMap.set(this.rendererSymbol, new WeakRef(this.#renderer));
    this.#renderer.autoClear = false;
    this.#renderer.setSize(width, height);
    // #TODO: #10: https://github.com/skgrush/cavern-seer-mapper/issues/10
    // // setting pixel ratio screws with raycasting??
    // this.#renderer.setPixelRatio(pixelRatio);

    this.#orthoCamera = this.#buildNewCamera(width, height);
    this.#orthoControls = new MapControls(this.#orthoCamera, canvas);
    this.#scene.add(this.#orthoCamera);

    this.#scene.add(new AmbientLight(0xFF2222, 2));

    this.#rendererChangedSubject.next();

    this.#compassDivSubject.pipe(
      takeUntil(this.#rendererChangedSubject),
      map(ele => {
        if (!ele || !this.#orthoControls || !this.#renderer?.domElement) {
          return undefined;
        }
        const compass = new ViewHelper(this.#orthoControls.object, this.#renderer.domElement);
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

  #buildNewCamera(width: number, height: number) {
    return new OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      0.1,
      2000,
    );
  }
}
