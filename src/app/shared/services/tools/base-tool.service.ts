import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { Vector2 } from "three";

export const TOOL_SERVICES = new InjectionToken<readonly BaseToolService[]>('tool-services');

export abstract class BaseToolService {

  abstract readonly id: string;
  abstract readonly label: string;
  abstract readonly icon: string;
  abstract readonly cursor$: Observable<string | undefined>;

  abstract start(): boolean;
  abstract stop(): boolean;

  /**
   * I still don't fully understand why this is needed, but convert the
   * pointer event offset coordinates to ThreeJS canvas coordinates.
   */
  normalizeCanvasCoords(offsetCoords: Vector2, dimensions: Vector2) {
    return offsetCoords
      .clone()
      .divide(dimensions)
      .multiply(new Vector2(2, -2))
      .add(new Vector2(-1, 1));
  }
}
