import { InjectionToken } from "@angular/core";

export const TOOL_SERVICES = new InjectionToken<readonly BaseToolService[]>('tool-services');

export abstract class BaseToolService {

  abstract readonly id: string;
  abstract readonly label: string;
  abstract readonly icon: string;

  abstract start(): boolean;
  abstract stop(): boolean;
}
