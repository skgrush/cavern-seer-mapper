import { Injectable } from '@angular/core';
import { MeshNormalMaterial } from 'three';
import { BaseMaterialService } from './base-material.service';

@Injectable()
export class MeshNormalMaterialService extends BaseMaterialService<MeshNormalMaterial> {
  override readonly material = new MeshNormalMaterial();
  override readonly type = 'normal';
  override readonly description = 'Material whose color is determined ' +
    'by the (normal) angle of the surface compared to the camera angle.';
}
