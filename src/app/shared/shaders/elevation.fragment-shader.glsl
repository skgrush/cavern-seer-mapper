/**
 * Fragment shader that uses `xyzPosition` to set
 * fragment color between `colorMin` and `colorMax` based
 * on the Y coordinate's distance between `yMin` and `yMax`.
 *
 * Depends on {@link xyzPositionVertexShader}.
 */

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
