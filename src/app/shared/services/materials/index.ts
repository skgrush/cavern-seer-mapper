import { makeEnvironmentProviders } from '@angular/core';
import { MATERIAL_SERVICES } from './base-material.service';
import { MeshNormalMaterialService } from './mesh-normal-material.service';
import { MeshStandardMaterialService } from './mesh-standard-material.service';

export function materialsProviders() {
  return makeEnvironmentProviders([
    MeshNormalMaterialService,
    MeshStandardMaterialService,
    { provide: MATERIAL_SERVICES, useExisting: MeshNormalMaterialService, multi: true },
    { provide: MATERIAL_SERVICES, useExisting: MeshStandardMaterialService, multi: true },
  ]);
}
