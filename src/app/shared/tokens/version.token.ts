import { InjectionToken } from "@angular/core";

export type VersionObject = {
  readonly version: string;
  readonly packageVersion: string;
  readonly buildNumber?: string;
}
export const MAPPER_VERSION = new InjectionToken<VersionObject>('build version');
