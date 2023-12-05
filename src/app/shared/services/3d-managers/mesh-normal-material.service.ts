import { Injectable } from '@angular/core';
import { MeshNormalMaterial } from 'three';
import { BaseMaterialService } from './base-material.service';

@Injectable()
export class MeshNormalMaterialService extends BaseMaterialService<MeshNormalMaterial> {

  constructor() {
    super(new MeshNormalMaterial());
  }
}
