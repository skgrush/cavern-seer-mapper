/**
 * Fragment shader that uses `xyzPosition` to
 * set fragment color to `contourColor` if the fragment is on
 * a multiple of `yIncrement`, or sub-increment.
 *
 * Sub-increments are 30% closer to black and are 1/3 the thickness of increments.
 *
 */

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
