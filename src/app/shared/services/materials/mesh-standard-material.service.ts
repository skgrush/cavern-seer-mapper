import { BaseMaterialService } from './base-material.service';
import { MeshStandardMaterial } from 'three';

/**
 * Requires a directional light.
 */
export class MeshStandardMaterialService extends BaseMaterialService<MeshStandardMaterial> {
  override readonly material = new MeshStandardMaterial({
    color: 0xCCCCCC,
    metalness: 0.2,
    flatShading: true,
  });
  override readonly type = 'standard';
  override readonly description = 'Material with a flat color and shadows';
}
