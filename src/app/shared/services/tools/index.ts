import { makeEnvironmentProviders } from "@angular/core";
import { DistanceMeasureToolService } from "./distance-measure-tool.service";
import { NoToolService } from "./no-tool.service";
import { EXCLUSIVE_TOOL_SERVICES, NONEXCLUSIVE_TOOL_SERVICES } from "./base-tool.service";
import { RaycastDistanceToolService } from "./raycast-distance-tool.service";
import { CrossSectionToolService } from "./cross-section-tool.service";

const services = [DistanceMeasureToolService, NoToolService];

export function toolsProviders() {
  return makeEnvironmentProviders([
    NoToolService,
    DistanceMeasureToolService,
    RaycastDistanceToolService,
    CrossSectionToolService,
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: NoToolService, multi: true },
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: DistanceMeasureToolService, multi: true },
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: RaycastDistanceToolService, multi: true },
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: CrossSectionToolService, multi: true },
  ]);
}
