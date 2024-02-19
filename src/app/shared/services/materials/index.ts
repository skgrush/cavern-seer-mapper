import { makeEnvironmentProviders } from '@angular/core';
import { MATERIAL_SERVICES } from './base-material.service';
import { MeshNormalMaterialService } from './mesh-normal-material.service';
import { MeshStandardMaterialService } from './mesh-standard-material.service';
import { MaterialManagerService } from './material-manager.service';
import { ElevationMaterialService } from './elevation-material.service';
import { ContourMaterialService } from './contour-material.service';

export function materialsProviders() {
  return makeEnvironmentProviders([
    MaterialManagerService,
    MeshNormalMaterialService,
    MeshStandardMaterialService,
    ElevationMaterialService,
    ContourMaterialService,
    { provide: MATERIAL_SERVICES, useExisting: MeshNormalMaterialService, multi: true },
    { provide: MATERIAL_SERVICES, useExisting: MeshStandardMaterialService, multi: true },
    { provide: MATERIAL_SERVICES, useExisting: ElevationMaterialService, multi: true },
    { provide: MATERIAL_SERVICES, useExisting: ContourMaterialService, multi: true },
  ]);
}
