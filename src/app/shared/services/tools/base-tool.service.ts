import { InjectionToken } from "@angular/core";
import { Observable, of } from "rxjs";

export const EXCLUSIVE_TOOL_SERVICES = new InjectionToken<readonly BaseExclusiveToolService[]>('exclusive-tool-services');
export const NONEXCLUSIVE_TOOL_SERVICES = new InjectionToken<readonly BaseClickToolService[]>('non-exclusive-tool-services');

export type Icon$Type = {
  readonly icon: string;
  readonly fontSet?: 'material-icons' | 'material-icons-outlined';
}

export abstract class BaseToolService {
  abstract readonly id: string;
  abstract readonly label: string;
  abstract readonly icon$: Observable<Icon$Type>;
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
}
