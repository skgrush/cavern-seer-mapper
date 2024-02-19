/**
 * Vertex shader that sets `xyzPosition`
 */
export const xyzPositionVertexShader = `
varying vec3 xyzPosition;

void main() {
    xyzPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
