precision highp float;

uniform vec2 resolution;
uniform sampler2D texture;
uniform vec2 delta1;
uniform vec2 delta2;
uniform float isDiagonal;

#pragma glslify: sample = require(./sample.frag)

void main(void) {
  vec2 uv = (gl_FragCoord.xy / resolution);
  vec4 color1 = sample(delta1, texture, uv);
  vec4 color2 = (sample(delta1, texture, uv) + sample(delta2, texture, uv)) * 0.5;
  gl_FragColor = mix(color1, color2, isDiagonal);
}
