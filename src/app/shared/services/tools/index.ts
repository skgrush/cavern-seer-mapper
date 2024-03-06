import { makeEnvironmentProviders } from "@angular/core";
import { DistanceMeasureToolService } from "./distance-measure-tool.service";
import { NoToolService } from "./no-tool.service";
import { EXCLUSIVE_TOOL_SERVICES, NONEXCLUSIVE_TOOL_SERVICES } from "./base-tool.service";
import { CeilingHeightToolService } from "./ceiling-height-tool.service";
import { CrossSectionToolService } from "./cross-section-tool.service";
import { ToggleMaterialSidesToolService } from "./toggle-material-sides-tool.service";
import {ToggleGridToolService} from "./toggle-grid-tool.service";
import { ToggleEmbeddedAnnotationsToolService } from './toggle-embedded-annotations-tool.service';
import { FullHeightMapToolService } from './full-height-map-tool.service';

export function toolsProviders() {
  return makeEnvironmentProviders([
    NoToolService,
    DistanceMeasureToolService,
    CeilingHeightToolService,
    CrossSectionToolService,
    ToggleMaterialSidesToolService,
    ToggleGridToolService,
    ToggleEmbeddedAnnotationsToolService,
    FullHeightMapToolService,
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: NoToolService, multi: true },
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: DistanceMeasureToolService, multi: true },
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: CeilingHeightToolService, multi: true },
    { provide: EXCLUSIVE_TOOL_SERVICES, useExisting: CrossSectionToolService, multi: true },
    { provide: NONEXCLUSIVE_TOOL_SERVICES, useExisting: ToggleMaterialSidesToolService, multi: true },
    { provide: NONEXCLUSIVE_TOOL_SERVICES, useExisting: ToggleGridToolService, multi: true },
    { provide: NONEXCLUSIVE_TOOL_SERVICES, useExisting: ToggleEmbeddedAnnotationsToolService, multi: true },
    { provide: NONEXCLUSIVE_TOOL_SERVICES, useExisting: FullHeightMapToolService, multi: true },
  ]);
}
