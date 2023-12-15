import { makeEnvironmentProviders } from "@angular/core";
import { MeasureToolService } from "./measure-tool.service";
import { NoToolService } from "./no-tool.service";
import { TOOL_SERVICES } from "./base-tool.service";
import { RaycastDistanceToolService } from "./raycast-distance-tool.service";

const services = [MeasureToolService, NoToolService];

export function toolsProviders() {
  return makeEnvironmentProviders([
    NoToolService,
    { provide: TOOL_SERVICES, useExisting: NoToolService, multi: true },
    { provide: TOOL_SERVICES, useClass: MeasureToolService, multi: true },
    { provide: TOOL_SERVICES, useClass: RaycastDistanceToolService, multi: true },
  ]);
}
