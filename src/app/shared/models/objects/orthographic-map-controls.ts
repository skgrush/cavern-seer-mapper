import type { OrthographicCamera } from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls"

export class OrthographicMapControls extends MapControls {
  get camera() {
    return this.object as OrthographicCamera;
  }

  constructor(cam: OrthographicCamera, domElement: HTMLElement) {
    super(cam, domElement);
  }
}
