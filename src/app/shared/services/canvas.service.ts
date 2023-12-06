import { Injectable, inject } from '@angular/core';
import { Subject, animationFrames, distinctUntilChanged, map, takeUntil, tap } from 'rxjs';
import { AmbientLight, Box3, GridHelper, Material, OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { GroupRenderModel } from '../models/render/group.render-model';
import { BaseMaterialService } from './3d-managers/base-material.service';
import { MeshNormalMaterialService } from './3d-managers/mesh-normal-material.service';
import { ModelManagerService } from './model-manager.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable()
export class CanvasService {

  readonly #modelManager = inject(ModelManagerService);

  readonly #scene = new Scene();
  #renderer?: WebGLRenderer;

  #orthoCamera?: OrthographicCamera;
  #orthoControls?: MapControls;

  readonly #meshNormalMaterial = inject(MeshNormalMaterialService);
  #material: BaseMaterialService<Material> = this.#meshNormalMaterial;

  #bottomGrid = new GridHelper();

  #currentGroupInScene?: GroupRenderModel;

  constructor() {
    this.#modelManager.currentOpenGroup$.pipe(
      takeUntilDestroyed(),
      distinctUntilChanged(),
      tap(group => {
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
      }),
    ).subscribe();
  }

  cleanupRenderer() {
    if (!this.#renderer) {
      return;
    }

    this.#renderer.dispose();
    this.#renderer = undefined;
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
    const rendererGone$ = new Subject<void>();
    return animationFrames().pipe(
      takeUntil(rendererGone$),
      map(({ timestamp, elapsed }) => {
        const rendered = this.render();
        if (!rendered) {
          rendererGone$.next();
        }
      }),
    );
  }

  render() {
    if (!this.#renderer) { return false; }

    this.#renderer.render(this.#scene, this.#orthoCamera!);
    return true;
  }

  setBgColor(bgColor: string) {
    if (!this.#renderer) {
      throw new Error('Attempt to setBgColor() with no renderer');
    }

    this.#renderer.setClearColor(bgColor);
  }

  // TODO: refocus doesn't seem to actually reposition the camera? I expect lookAt to do that but it's not
  #refocusCamera(bounds: Box3) {
    const controls = this.#orthoControls;
    const camera = this.#orthoCamera;
    if (!controls || !camera) {
      console.error('missing controls/camera', this);
      return;
    }

    camera.near = 0.1;
    camera.position.set(
      0,
      bounds.max.y,
      0
    );
    camera.lookAt(0, 0, 0);

    camera.updateProjectionMatrix();

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
    const gridHelper = this.#bottomGrid = new GridHelper(size, size);
    gridHelper.position.x = boundsMin.x + sizeX / 2;
    gridHelper.position.y = boundsMin.y;
    gridHelper.position.z = boundsMin.z + sizeZ / 2;
    this.#scene.add(gridHelper);
  }

  initializeRenderer(
    canvas: HTMLCanvasElement,
    { width, height }: DOMRectReadOnly,
  ) {
    this.cleanupRenderer();

    this.#renderer = new WebGLRenderer({
      canvas,
    });
    this.#orthoCamera = this.#buildNewCamera(width, height);
    this.#orthoControls = new MapControls(this.#orthoCamera, canvas);
    this.#scene.add(this.#orthoCamera);

    this.#scene.add(new AmbientLight(0xFF2222, 2));

    this.#renderer.setSize(width, height);

    this.#renderer.render(this.#scene, this.#orthoCamera);
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
