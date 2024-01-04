import {
  BoxGeometry,
  Camera,
  CanvasTexture,
  Color,
  Euler,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  Quaternion,
  Raycaster,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer
} from 'three';

/**
 * Copy of Three.JS's
 * {@link https://github.com/mrdoob/three.js/blob/de6dd45d7e5aa58fed0fbc1dbe53def3402b39cc/examples/jsm/helpers/ViewHelper.js}
 *
 * but not reliant on auto updated matrices.
 */
export class MyViewHelper extends Object3D {
  readonly camera: Camera;
  readonly domElement: HTMLElement;

  get animating() {
    return this.#animating;
  }

  readonly isViewHelper = true;
  #animating = false;
  readonly center = new Vector3();
  readonly dim = 128;
  readonly viewport = new Vector4();

  readonly geometry = new BoxGeometry(0.8, 0.05, 0.05).translate(0.4, 0, 0);

  readonly interactiveObjects: Sprite[] = [];
  readonly raycaster = new Raycaster();
  readonly mouse = new Vector2();
  readonly dummy = new Object3D();

  readonly posXAxisHelper: Sprite;
  readonly posYAxisHelper: Sprite;
  readonly posZAxisHelper: Sprite;
  readonly negXAxisHelper: Sprite;
  readonly negYAxisHelper: Sprite;
  readonly negZAxisHelper: Sprite;

  readonly xAxis: Mesh<BoxGeometry, MeshBasicMaterial>;
  readonly yAxis: Mesh<BoxGeometry, MeshBasicMaterial>;
  readonly zAxis: Mesh<BoxGeometry, MeshBasicMaterial>;

  readonly point = new Vector3();

  readonly orthoCamera = new OrthographicCamera(- 2, 2, 2, - 2, 0, 4);

  readonly turnRate = 2 * Math.PI; // turn rate in angles per second

  readonly targetPosition = new Vector3();
  readonly targetQuaternion = new Quaternion();

  readonly q1 = new Quaternion();
  readonly q2 = new Quaternion();
  #radius = 0;

  constructor(camera: Camera, domElement: HTMLElement) {

    super();

    this.camera = camera;
    this.domElement = domElement;

    const color1 = new Color('#ff3653');
    const color2 = new Color('#8adb00');
    const color3 = new Color('#2c8fff');

    this.orthoCamera.position.set(0, 0, 2);
    this.orthoCamera.updateMatrix(); // Not in original implementation
    this.orthoCamera.updateMatrixWorld(true); // Not in original implementation

    this.xAxis = new Mesh(this.geometry, this.getAxisMaterial(color1));
    this.yAxis = new Mesh(this.geometry, this.getAxisMaterial(color2));
    this.zAxis = new Mesh(this.geometry, this.getAxisMaterial(color3));

    this.yAxis.rotation.z = Math.PI / 2;
    this.zAxis.rotation.y = - Math.PI / 2;

    this.add(this.xAxis);
    this.add(this.zAxis);
    this.add(this.yAxis);

    this.posXAxisHelper = new Sprite(this.getSpriteMaterial(color1, 'X'));
    this.posXAxisHelper.userData['type'] = 'posX';
    this.posYAxisHelper = new Sprite(this.getSpriteMaterial(color2, 'Y'));
    this.posYAxisHelper.userData['type'] = 'posY';
    this.posZAxisHelper = new Sprite(this.getSpriteMaterial(color3, 'Z'));
    this.posZAxisHelper.userData['type'] = 'posZ';
    this.negXAxisHelper = new Sprite(this.getSpriteMaterial(color1));
    this.negXAxisHelper.userData['type'] = 'negX';
    this.negYAxisHelper = new Sprite(this.getSpriteMaterial(color2));
    this.negYAxisHelper.userData['type'] = 'negY';
    this.negZAxisHelper = new Sprite(this.getSpriteMaterial(color3));
    this.negZAxisHelper.userData['type'] = 'negZ';

    this.posXAxisHelper.position.x = 1;
    this.posYAxisHelper.position.y = 1;
    this.posZAxisHelper.position.z = 1;
    this.negXAxisHelper.position.x = - 1;
    this.negXAxisHelper.scale.setScalar(0.8);
    this.negYAxisHelper.position.y = - 1;
    this.negYAxisHelper.scale.setScalar(0.8);
    this.negZAxisHelper.position.z = - 1;
    this.negZAxisHelper.scale.setScalar(0.8);

    this.add(this.posXAxisHelper);
    this.add(this.posYAxisHelper);
    this.add(this.posZAxisHelper);
    this.add(this.negXAxisHelper);
    this.add(this.negYAxisHelper);
    this.add(this.negZAxisHelper);

    this.interactiveObjects.push(this.posXAxisHelper);
    this.interactiveObjects.push(this.posYAxisHelper);
    this.interactiveObjects.push(this.posZAxisHelper);
    this.interactiveObjects.push(this.negXAxisHelper);
    this.interactiveObjects.push(this.negYAxisHelper);
    this.interactiveObjects.push(this.negZAxisHelper);

    this.traverse(c => c.updateMatrix());
  }

  render(renderer: WebGLRenderer) {

    const point = this.point;
    const dim = this.dim;
    const viewport = this.viewport;

    this.quaternion.copy(this.camera.quaternion).invert();
    this.updateMatrix();
    this.updateMatrixWorld(true);

    point.set(0, 0, 1);
    point.applyQuaternion(this.camera.quaternion);

    if (point.x >= 0) {

      this.posXAxisHelper.material.opacity = 1;
      this.negXAxisHelper.material.opacity = 0.5;

    } else {

      this.posXAxisHelper.material.opacity = 0.5;
      this.negXAxisHelper.material.opacity = 1;

    }

    if (point.y >= 0) {

      this.posYAxisHelper.material.opacity = 1;
      this.negYAxisHelper.material.opacity = 0.5;

    } else {

      this.posYAxisHelper.material.opacity = 0.5;
      this.negYAxisHelper.material.opacity = 1;

    }

    if (point.z >= 0) {

      this.posZAxisHelper.material.opacity = 1;
      this.negZAxisHelper.material.opacity = 0.5;

    } else {

      this.posZAxisHelper.material.opacity = 0.5;
      this.negZAxisHelper.material.opacity = 1;

    }

    //

    const x = this.domElement.offsetWidth - dim;

    renderer.clearDepth();

    renderer.getViewport(viewport);
    renderer.setViewport(x, 0, dim, dim);

    renderer.render(this, this.orthoCamera);

    renderer.setViewport(viewport.x, viewport.y, viewport.z, viewport.w);

  };

  handleClick(event: MouseEvent) {

    if (this.#animating === true) return false;

    const domElement = this.domElement;
    const mouse = this.mouse;

    const rect = domElement.getBoundingClientRect();
    const offsetX = rect.left + (domElement.offsetWidth - this.dim);
    const offsetY = rect.top + (domElement.offsetHeight - this.dim);
    mouse.x = ((event.clientX - offsetX) / (rect.right - offsetX)) * 2 - 1;
    mouse.y = - ((event.clientY - offsetY) / (rect.bottom - offsetY)) * 2 + 1;

    this.raycaster.setFromCamera(mouse, this.orthoCamera);

    const intersects = this.raycaster.intersectObjects(this.interactiveObjects);

    if (intersects.length > 0) {

      const intersection = intersects[0];
      const object = intersection.object;

      this.prepareAnimationData(object, this.center);

      this.#animating = true;

      return true;

    } else {
      return false;
    }

  };

  update(delta: number) {

    const q1 = this.q1;
    const q2 = this.q2;

    const step = delta * this.turnRate;

    // animate position by doing a slerp and then scaling the position on the unit sphere

    q1.rotateTowards(q2, step);
    this.camera.position.set(0, 0, 1).applyQuaternion(q1).multiplyScalar(this.#radius).add(this.center);
    this.camera.updateMatrixWorld(true);

    // animate orientation

    this.camera.quaternion.rotateTowards(this.targetQuaternion, step);

    if (q1.angleTo(q2) === 0) {

      this.#animating = false;

    }

  };

  dispose() {

    this.geometry.dispose();

    this.xAxis.material.dispose();
    this.yAxis.material.dispose();
    this.zAxis.material.dispose();

    this.posXAxisHelper.material.map?.dispose();
    this.posYAxisHelper.material.map?.dispose();
    this.posZAxisHelper.material.map?.dispose();
    this.negXAxisHelper.material.map?.dispose();
    this.negYAxisHelper.material.map?.dispose();
    this.negZAxisHelper.material.map?.dispose();

    this.posXAxisHelper.material.dispose();
    this.posYAxisHelper.material.dispose();
    this.posZAxisHelper.material.dispose();
    this.negXAxisHelper.material.dispose();
    this.negYAxisHelper.material.dispose();
    this.negZAxisHelper.material.dispose();

  };

  prepareAnimationData(object: Object3D, focusPoint: Vector3) {

    switch (object.userData['type']) {

      case 'posX':
        this.targetPosition.set(1, 0, 0);
        this.targetQuaternion.setFromEuler(new Euler(0, Math.PI * 0.5, 0));
        break;

      case 'posY':
        this.targetPosition.set(0, 1, 0);
        this.targetQuaternion.setFromEuler(new Euler(- Math.PI * 0.5, 0, 0));
        break;

      case 'posZ':
        this.targetPosition.set(0, 0, 1);
        this.targetQuaternion.setFromEuler(new Euler());
        break;

      case 'negX':
        this.targetPosition.set(- 1, 0, 0);
        this.targetQuaternion.setFromEuler(new Euler(0, - Math.PI * 0.5, 0));
        break;

      case 'negY':
        this.targetPosition.set(0, - 1, 0);
        this.targetQuaternion.setFromEuler(new Euler(Math.PI * 0.5, 0, 0));
        break;

      case 'negZ':
        this.targetPosition.set(0, 0, - 1);
        this.targetQuaternion.setFromEuler(new Euler(0, Math.PI, 0));
        break;

      default:
        console.error('ViewHelper: Invalid axis.');

    }

    //

    this.#radius = this.camera.position.distanceTo(focusPoint);
    this.targetPosition.multiplyScalar(this.#radius).add(focusPoint);

    this.dummy.position.copy(focusPoint);

    this.dummy.lookAt(this.camera.position);
    this.q1.copy(this.dummy.quaternion);

    this.dummy.lookAt(this.targetPosition);
    this.q2.copy(this.dummy.quaternion);

  }

  getAxisMaterial(color: Color) {

    return new MeshBasicMaterial({ color: color, toneMapped: false });

  }

  getSpriteMaterial(color: Color, text: 'X' | 'Y' | 'Z' | null = null) {

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const context = canvas.getContext('2d')!;
    context.beginPath();
    context.arc(32, 32, 16, 0, 2 * Math.PI);
    context.closePath();
    context.fillStyle = color.getStyle();
    context.fill();

    if (text !== null) {

      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillStyle = '#000000';
      context.fillText(text, 32, 41);

    }

    const texture = new CanvasTexture(canvas);

    return new SpriteMaterial({ map: texture, toneMapped: false });

  }

}
