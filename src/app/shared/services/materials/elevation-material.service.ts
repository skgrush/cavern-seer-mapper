import { Injectable } from '@angular/core';
import { BaseMaterialService } from './base-material.service';
import { Color, ShaderMaterial } from 'three';
import { colorToVector3 } from '../../functions/color-to-vector3';
import { xyzPositionVertexShader } from '../../shaders/xyzPosition.vertex-shader';

/**
 * Fragment shader that uses `xyzPosition` to set
 * fragment color between `colorMin` and `colorMax` based
 * on the Y coordinate's distance between `yMin` and `yMax`.
 */
const fragmentShader = `
uniform float yMin;
uniform float yMax;

uniform vec3 colorMin;
uniform vec3 colorMax;

varying vec3 xyzPosition;

void main()
{
  float yPos = xyzPosition.y;

  yPos = clamp(yPos, yMin, yMax);
  float fractionBetweenMinAndMax = (yPos - yMin) / (yMax - yMin);

  gl_FragColor.rgb = mix(colorMin, colorMax, fractionBetweenMinAndMax);
  gl_FragColor.a = 1.0;
}
`;


@Injectable()
export class ElevationMaterialService extends BaseMaterialService<ShaderMaterial> {

  readonly defaultColorMin = 'blue';
  readonly defaultColorMax = 'red';

  // readonly colorMin = new Color(Color.NAMES.blue);
  // readonly colorMax = new Color(Color.NAMES.red);

  override readonly material = new ShaderMaterial({
    uniforms: {
      yMin: { value: -1.5 },
      yMax: { value: 1 },
      colorMin: { value: colorToVector3(new Color(this.defaultColorMin)) },
      colorMax: { value: colorToVector3(new Color(this.defaultColorMax)) },
    },
    fragmentShader,
    vertexShader: xyzPositionVertexShader,
  });
  override readonly type = 'elevation';
  override readonly description = `Material that shades from ${this.defaultColorMin} to ${this.defaultColorMax} based on elevation.`;

  updateRange(yMin: number, yMax: number) {
    this.material.uniforms['yMin'].value = yMin;
    this.material.uniforms['yMax'].value = yMax;
  }

  // updateColors(arg: { colorMin: Color, colorMax: Color }) {
  //   for (const key of ['colorMin', 'colorMax'] as const) {
  //     this.material.uniforms[key].value = colorToVector3(this[key].copy(arg[key]));
  //   }
  // }
}
