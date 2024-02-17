import { Injectable } from '@angular/core';
import { MeshNormalMaterial } from 'three';
import { BaseMaterialService } from './base-material.service';

@Injectable()
export class MeshNormalMaterialService extends BaseMaterialService<MeshNormalMaterial> {
  override readonly material = new MeshNormalMaterial();
}