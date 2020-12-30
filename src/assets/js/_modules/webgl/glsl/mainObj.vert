precision highp float;
precision highp int;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float time;
uniform float numChars;
uniform float interval;
uniform float loopOffset;
uniform float scroll;
uniform float scrollDelta;

attribute vec3 position;
attribute vec3 offset;
attribute vec2 uv;
attribute vec3 normal;
attribute float instanceIndex;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

const vec3 AXIS_Z = vec3(0.0, 0.0, 1.0);

#pragma glslify: getRotateMatrix3 = require(../../../_utils/glsl/getRotateMatrix3.glsl)
#pragma glslify: rotateVec3 = require(../../../_utils/glsl/rotateVec3.glsl)
#pragma glslify: PI = require(../../../_utils/glsl/PI.glsl)
#pragma glslify: map = require(../../../_utils/glsl/map.glsl)

void main(void){
  vec3 pos = position;
  vec3 n = normal;
  float scrollingFactor = clamp(abs(scrollDelta) / 50.0, 0.0, 1.0);
  float t = time * 0.005 - instanceIndex * 0.4;
  float sinValue = (sin(t * 2.0) + 1.0) * 0.5 * (1.0 - scrollingFactor);
  vec3 rotCenter = vec3(cos(t) * 120.0, 0.0, 1.0);

  float sy = (1.0 + sinValue + scrollingFactor * 1.6);
  pos.y *= sy;
  n.y *= sy;

  float sx = (1.0 - sinValue * pos.y * 0.002 - scrollingFactor * 0.4);
  pos.x *= sx;
  n.x *= sx;

  float angle = PI * 0.001 * pos.y * cos(t);
  mat3 rotMatrix = getRotateMatrix3(angle, AXIS_Z);
  pos = rotMatrix * (pos - rotCenter);
  pos += rotCenter;
  pos.xy += offset.xy;

  float offsetZ = offset.z + time * 0.12 + scroll;
  offsetZ = mod(offsetZ - loopOffset, -interval * numChars) + loopOffset;
  pos.z += offsetZ;

  n = normalize(n);
  n = rotMatrix * n;

  vec4 modelPos = modelMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * viewMatrix * modelPos;
  vUv = uv;
  vPos = modelPos.xyz;
  vNormal = n;
}
