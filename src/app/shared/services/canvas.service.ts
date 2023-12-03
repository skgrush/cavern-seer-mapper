import { Injectable } from '@angular/core';
import { Subject, animationFrames, map, takeUntil } from 'rxjs';
import { ACESFilmicToneMapping, AmbientLight, BoxHelper, Color, GridHelper, Mesh, MeshDepthMaterial, Object3D, OrthographicCamera, PMREMGenerator, Scene, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

@Injectable()
export class CanvasService {

  readonly #scene = new Scene();
  #renderer?: WebGLRenderer;

  #orthoCamera?: OrthographicCamera;
  #orthoControls?: MapControls;
  #bgColor?: string;

  readonly #currentModels: any[] = [];

  constructor() { }

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
        if (!this.#renderer) { rendererGone$.next(); return; }

        this.#renderer.render(this.#scene, this.#orthoCamera!);
      }),
    );
  }

  setBgColor(bgColor: string) {
    if (!this.#renderer) {
      throw new Error('Attempt to setBgColor() with no renderer');
    }

    this.#bgColor = bgColor;
    this.#renderer.setClearColor(bgColor);
  }

  resetModel(model: Object3D) {
    if (!this.#renderer) {
      throw new Error('Attempt to call resetModel() with no renderer');
    }

    this.#scene.remove(...this.#currentModels);
    this.#currentModels.length = 0;

    const material = new MeshDepthMaterial();
    console.info('material', material);
    model.traverse(child => {
      if (child instanceof Mesh) {
        child.material = material;
      }
    });

    this.#currentModels.push(model);
    this.#scene.add(model);

    const environment = new RoomEnvironment();
    const pmremGen = new PMREMGenerator(this.#renderer);

    // this.#scene.background = new Color(0xBBBBBB);
    this.#scene.environment = pmremGen.fromScene(environment).texture;

    this.#renderer.toneMapping = ACESFilmicToneMapping;
    this.#renderer.toneMappingExposure = 1.2;

    if (!this.#orthoCamera) {
      return;
    }

    const bounds = new BoxHelper(model);
    bounds.geometry.computeBoundingBox();
    const { max: boundsMax, min: boundsMin } = bounds.geometry.boundingBox!;

    // create a grid
    const sizeX = boundsMax.x - boundsMin.x;
    const sizeZ = boundsMax.z - boundsMin.z;
    const size = Math.max(sizeX, sizeZ);
    const gridHelper = new GridHelper(size, size);
    gridHelper.position.x = boundsMin.x + sizeX / 2;
    gridHelper.position.y = boundsMin.y;
    gridHelper.position.z = boundsMin.z + sizeZ / 2;
    this.#scene.add(gridHelper);
    this.#currentModels.push(gridHelper);

    // move the camera
    this.#orthoCamera.position.x = 0;
    this.#orthoCamera.position.y = boundsMax.y + 1;
    this.#orthoCamera.position.z = 0;
    this.#orthoCamera.lookAt(0, 0, 0);
    this.#orthoCamera.far = (boundsMax.y - boundsMin.y) + 2;
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
      1,
      50,
    );
  }
}
