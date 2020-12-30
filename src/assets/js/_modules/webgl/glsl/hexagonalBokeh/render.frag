precision highp float;

uniform vec2 resolution;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform float power;
uniform vec2 delta1;
uniform vec2 delta2;

#pragma glslify: sample = require(./sample.frag')

void main(void) {
  vec2 uv = (gl_FragCoord.xy / resolution);
  vec4 color = (sample(delta1, texture1, uv) + 2.0 * sample(delta2, texture2, uv)) / 3.0;
  color = vec4(pow(color.rgb, vec3(power)), 1.0);
  gl_FragColor = color;
}
