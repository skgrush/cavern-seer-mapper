import { inject, Injectable } from '@angular/core';
import { BaseMaterialService } from './base-material.service';
import { Color, Material, MeshNormalMaterial, ShaderMaterial } from 'three';
import { xyzPositionVertexShader } from '../../shaders/xyzPosition.vertex-shader';
import { SettingsService } from '../settings/settings.service';
import { colorToVector3 } from '../../functions/color-to-vector3';
import { LocalizeService } from '../localize.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Fragment shader that uses `xyzPosition` to
 * set fragment color to `contourColor` if the fragment is on
 * a multiple of `yIncrement`, or sub-increment.
 *
 * Sub-increments are 30% closer to black and are 1/3 the thickness of increments.
 *
 */
const fragmentShader = `
uniform float yIncrement;
uniform vec3 contourColor;
uniform float roundPrecision;
uniform uint numSubIncrements;

varying vec3 xyzPosition;

void main()
{
  // primary increment
  if (mod( xyzPosition.y, yIncrement ) < roundPrecision) {
    gl_FragColor.rgb = contourColor;
    gl_FragColor.a = 1.0;
  }
  else {
    // sub-increments
    for (uint i = 0u; i < numSubIncrements; ++i) {
      if (mod( xyzPosition.y + yIncrement * float(i) / float(numSubIncrements) , yIncrement ) < roundPrecision / 3.0) {
        gl_FragColor.rgb = mix(contourColor, vec3(0,0,0), 0.3);
        gl_FragColor.a = 1.0;
      }
    }
  }
}
`;

@Injectable()
export class ContourMaterialService extends BaseMaterialService<Material[]> {
  readonly #settings = inject(SettingsService);
  readonly #localize = inject(LocalizeService);

  readonly subIncrements = 5;

  readonly #normalMat = new MeshNormalMaterial({
    depthTest: false,
    transparent: true,
  });
  readonly #shaderMat = new ShaderMaterial({
    uniforms: {
      yIncrement: { value: 1 },
      contourColor: { value: colorToVector3(new Color('white')) },
      roundPrecision: { value: 0.01 },
      numSubIncrements: { value: this.subIncrements },
    },
    fragmentShader,
    vertexShader: xyzPositionVertexShader,
    transparent: true,
    depthTest: true,
    depthWrite: true,
  });

  override readonly material = [
    this.#normalMat,
    this.#shaderMat,
  ];
  override readonly type = 'contour';
  override readonly description = `Normal material with contour lines at each height increment and each ${this.subIncrements} sub-increments.`;

  constructor() {
    super();
    this.#settings.measurementSystem$.pipe(
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.#shaderMat.uniforms['yIncrement'].value = 1 / this.#localize.metersToLocalLength(1);
    });
  }
}
