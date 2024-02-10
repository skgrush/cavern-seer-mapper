import { Injectable } from '@angular/core';
import { Color, MeshNormalMaterial } from 'three';
import { BaseMaterialService } from './base-material.service';

@Injectable()
export class MeshNormalMaterialService extends BaseMaterialService<MeshNormalMaterial> {
  override material: MeshNormalMaterial;


  constructor() {
    super();
    this.material = new MeshNormalMaterial();
    (this.material as any).color = new Color(0, 0, 0);
  }
}
