import { inject, Injectable } from '@angular/core';
import { BaseMaterialService } from './base-material.service';
import { Color, Material, MeshNormalMaterial, ShaderMaterial } from 'three';
import xyzPositionVertexShader from '../../shaders/xyzPosition.vertex-shader.glsl';
import { SettingsService } from '../settings/settings.service';
import { colorToVector3 } from '../../functions/color-to-vector3';
import { LocalizeService } from '../localize.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import fragmentShader from '../../shaders/contour-material.fragment-shader.glsl';

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
