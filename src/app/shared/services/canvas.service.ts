import { Injectable } from '@angular/core';
import { OrthographicCamera, Scene, WebGLRenderer } from 'three';

@Injectable()
export class CanvasService {

  readonly #scene = new Scene();
  #renderer?: WebGLRenderer;

  #orthoCamera?: OrthographicCamera;

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

    this.#renderer.setSize(width, height);
  }

  setBgColor(bgColor: string) {
    if (!this.#renderer) {
      throw new Error('Attempt to setBgColor() with no renderer');
    }

    this.#renderer.setClearColor(bgColor);
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

    this.#renderer.setSize(width, height);

    this.#scene.add(this.#orthoCamera);

    this.#renderer.render(this.#scene, this.#orthoCamera);
  }

  #buildNewCamera(width: number, height: number) {
    return new OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      1,
      1000,
    );
  }
}
