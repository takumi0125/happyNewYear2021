precision highp float;

const vec3 lightPos = vec3(200.0, 200.0, 200.0);
const vec3 lightColor = vec3(1.0, 1.0, 1.0);
const vec3 ambientColor = vec3(1.0, 1.0, 1.0) * 0.1;

uniform vec3 cameraPosition;

varying vec3 vPos;
varying vec3 vNormal;

void main(void) {
  vec3 light = normalize(lightPos - vPos);
  vec3 eye = normalize(vPos - cameraPosition);
  vec3  halfLE = normalize(light + eye);
  float diffuse = clamp(dot(vNormal, light), 0.0, 1.0) + 0.2;
  float specular  = pow(clamp(dot(vNormal, halfLE), 0.0, 1.0), 50.0);
  vec3  color = lightColor * vec3(diffuse) + vec3(specular) + ambientColor;

  gl_FragColor = vec4(color, 1.0);
}
