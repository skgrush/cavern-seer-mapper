import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export const TOOL_SERVICES = new InjectionToken<readonly BaseToolService[]>('tool-services');

export abstract class BaseToolService {

  abstract readonly id: string;
  abstract readonly label: string;
  abstract readonly icon: string;
  abstract readonly cursor$: Observable<string | undefined>;

  abstract start(): boolean;
  abstract stop(): boolean;
}
