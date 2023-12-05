import { Injectable, inject } from '@angular/core';
import { Subject, animationFrames, map, takeUntil } from 'rxjs';
import { AmbientLight, Box3, GridHelper, Material, Object3D, OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { BaseModel } from '../models/base.model';
import { GroupModel } from '../models/group.model';
import { BaseMaterialService } from './3d-managers/base-material.service';
import { MeshNormalMaterialService } from './3d-managers/mesh-normal-material.service';

@Injectable()
export class CanvasService {

  readonly #scene = new Scene();
  #renderer?: WebGLRenderer;

  #orthoCamera?: OrthographicCamera;
  #orthoControls?: MapControls;

  readonly #meshNormalMaterial = inject(MeshNormalMaterialService);
  #material: BaseMaterialService<Material> = this.#meshNormalMaterial;

  #bottomGrid = new GridHelper();

  #currentModels = new GroupModel();

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

  resetModel(model: BaseModel<any>) {
    if (!this.#renderer || !this.#orthoCamera || !this.#orthoControls) {
      throw new Error('Attempt to call resetModel() with no renderer');
    }

    this.#currentModels.removeFromScene(this.#scene);
    this.#currentModels.dispose();

    this.#currentModels = new GroupModel();
    this.#currentModels.addModel(model);
    this.#currentModels.addToScene(this.#scene);

    model.setMaterial(this.#material);

    const bounds = this.#currentModels.getBoundingBox();

    this.#rebuildBottomGrid(bounds);
    this.#refocusCamera(bounds);

    this.render();
  }

  #refocusCamera(bounds: Box3) {
    const controls = this.#orthoControls;
    const camera = this.#orthoCamera;
    if (!controls || !camera) {
      throw new Error('missing controls/camera');
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
