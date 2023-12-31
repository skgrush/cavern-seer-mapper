import { makeEnvironmentProviders } from "@angular/core";
import { DistanceMeasureToolService } from "./distance-measure-tool.service";
import { NoToolService } from "./no-tool.service";
import { EXCLUSIVE_TOOL_SERVICES, NONEXCLUSIVE_TOOL_SERVICES } from "./base-tool.service";
import { CeilingHeightToolService } from "./ceiling-height-tool.service";
import { CrossSectionToolService } from "./cross-section-tool.service";
import { ToggleMaterialSidesToolService } from "./toggle-material-sides-tool.service";

const services = [DistanceMeasureToolService, NoToolService];

export function toolsProviders() {
  return makeEnvironmentProviders([
    NoToolService,
    DistanceMeasureToolService,
    CeilingHeightToolService,
    CrossSectionToolService,
    ToggleMaterialSidesToolService,
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: NoToolService, multi: true },
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: DistanceMeasureToolService, multi: true },
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: CeilingHeightToolService, multi: true },
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: CrossSectionToolService, multi: true },
    { provide: NONEXCLUSIVE_TOOL_SERVICES, useExisting: ToggleMaterialSidesToolService, multi: true },
  ]);
}
