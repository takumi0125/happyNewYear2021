const float SAMPLE_COUNT = 30.0;

// float random(vec3 scale, float seed) {
//   return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
// }

vec4 sample(vec2 delta, sampler2D tex, vec2 uv) {
  // float offset = random(vec3(delta, 151.7182), 0.0);
  float offset = 0.5;

  float r = 1.0 / SAMPLE_COUNT;
  vec3 color = vec3(0.0);
  float total = 0.0;
  for (float i = 0.0; i <= SAMPLE_COUNT; i++) {
    float percent = (i + offset) * r;
    color += texture2D(tex, uv + delta * percent).rgb;
  }
  return vec4(color * r, 1.0);
}
#pragma glslify: export(sample)