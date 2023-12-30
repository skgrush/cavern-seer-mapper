import { InjectionToken } from "@angular/core";
import { Observable, of } from "rxjs";
import { Vector2 } from "three";

export const EXCLUSIVE_TOOL_SERVICES = new InjectionToken<readonly BaseExclusiveToolService[]>('exclusive-tool-services');
export const NONEXCLUSIVE_TOOL_SERVICES = new InjectionToken<readonly BaseClickToolService[]>('non-exclusive-tool-services');

export abstract class BaseToolService {
  abstract readonly id: string;
  abstract readonly label: string;
  abstract readonly icon: string;

  readonly fontSet$: Observable<'material-icons' | 'material-icons-outlined'> = of('material-icons');
}

export abstract class BaseClickToolService extends BaseToolService {
  abstract click(): void;
}

/**
 * Tools which gain exclusive control and must start and stop as they switch.
 */
export abstract class BaseExclusiveToolService extends BaseToolService {
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
