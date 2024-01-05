import { OrthographicCamera } from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls"

export class OrthographicMapControls extends MapControls {
  override object!: OrthographicCamera;
  constructor(cam: OrthographicCamera, domElement: HTMLElement) {
    super(cam, domElement);
  }
}
