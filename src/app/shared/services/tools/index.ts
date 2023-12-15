import { makeEnvironmentProviders } from "@angular/core";
import { MeasureToolService } from "./measure-tool.service";
import { NoToolService } from "./no-tool.service";
import { TOOL_SERVICES } from "./base-tool.service";
import { RaycastDistanceToolService } from "./raycast-distance-tool.service";

const services = [MeasureToolService, NoToolService];

export function toolsProviders() {
  return makeEnvironmentProviders([
    NoToolService,
    MeasureToolService,
    RaycastDistanceToolService,
    { provide: TOOL_SERVICES, useExisting: NoToolService, multi: true },
    { provide: TOOL_SERVICES, useExisting: MeasureToolService, multi: true },
    { provide: TOOL_SERVICES, useExisting: RaycastDistanceToolService, multi: true },
  ]);
}
