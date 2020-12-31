import { RawShaderMaterial } from 'three/src/materials/RawShaderMaterial'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { WebGL1Renderer } from 'three/src/renderers/WebGL1Renderer';
import { Texture } from 'three/src/textures/Texture';
import { Vector2 } from 'three/src/math/Vector2';
import { FloatType, HalfFloatType } from 'three/src/constants';

import SwappableRenderTexture from './SwappableRenderTexture';

const TEXTURE_RATIO = 1;


export default class HexagonalBokeh {
  protected renderer!: WebGL1Renderer;
  protected planeGeometry!: PlaneGeometry;
  protected width: number = 1;
  protected height: number = 1;
  protected angle: number = 0;
  protected radius: number = 0;

  protected blurMaterial!: RawShaderMaterial;
  protected renderMaterial!: RawShaderMaterial;

  protected blurTextures: SwappableRenderTexture[] = [];
  protected texRes: Vector2 = new Vector2();
  protected delta: Vector2[] = [];
  protected renderTexture!: Texture;

  constructor() {}

  public init(
    renderer: WebGL1Renderer,
    planeGeometry: PlaneGeometry,
    width: number,
    height: number,
    radius: number,
    angle: number = 0,
    power: number = 0.01
  ) {
    this.renderer = renderer;
    this.width = width;
    this.height = height;
    this.planeGeometry = planeGeometry || new PlaneGeometry(100, 100);

    this.angle = angle;
    this.radius = radius;

    // materials
    this.blurMaterial = new RawShaderMaterial({
      vertexShader: require('./glsl/plane.vert').default,
      fragmentShader: require('./glsl/hexagonalBokeh/blur.frag').default,
      depthTest: false,
      transparent: true,
      uniforms: {
        resolution: { value: new Vector2() },
        texture   : { value: null  },
        delta1    : { value: new Vector2() },
        delta2    : { value: new Vector2() },
        isDiagonal: { value: 0     },
      }
    });

    this.renderMaterial = new RawShaderMaterial({
      vertexShader: require('./glsl/plane.vert').default,
      fragmentShader: require('./glsl/hexagonalBokeh/render.frag').default,
      transparent: true,
      depthTest: false,
      uniforms: {
        resolution: { value: new Vector2() },
        texture1  : { value: null  },
        texture2  : { value: null  },
        delta1    : { value: new Vector2() },
        delta2    : { value: new Vector2() },
        power     : { value: 1     },
      }
    });

    // swappableRenderTexture
    this.blurTextures = [
      this.createBlurTexture(),
      this.createBlurTexture()
    ];

    this.texRes = this.blurTextures[1].getTextureResolution();
    this.setPower(power);
    this.calculateDelta();
  }

  protected createBlurTexture() {
    const blurTexture = new SwappableRenderTexture(
      this.width, this.height, this.renderer,
      this.blurMaterial,
      {
        // type: HalfFloatType
      },
      this.planeGeometry
    );
    return blurTexture;
  }

  public onResize(width, height) {
    this.width = width;
    this.height = height;

    this.blurTextures[0].setSize(width * TEXTURE_RATIO, height * TEXTURE_RATIO);
    this.blurTextures[1].setSize(width * TEXTURE_RATIO, height * TEXTURE_RATIO);

    this.texRes = this.blurTextures[1].getTextureResolution();

    this.blurMaterial.uniforms.resolution.value.x = this.texRes.x;
    this.blurMaterial.uniforms.resolution.value.y = this.texRes.y;

    this.renderMaterial.uniforms.resolution.value.x = this.texRes.x;
    this.renderMaterial.uniforms.resolution.value.y = this.texRes.y;

    this.calculateDelta();
  }

  public update(mainSceneTexture: Texture) {
    this.blurMaterial.uniforms.texture.value = mainSceneTexture;

    // vertical blur
    this.blurTextures[0].setMaterial(this.blurMaterial);
    this.blurMaterial.uniforms.isDiagonal.value = 0;
    this.blurMaterial.uniforms.delta1.value = this.delta[0];
    this.blurTextures[0].render();

    // diagonal blur
    this.blurTextures[1].setMaterial(this.blurMaterial);
    this.blurMaterial.uniforms.isDiagonal.value = 1;
    this.blurMaterial.uniforms.delta1.value = this.delta[0];
    this.blurMaterial.uniforms.delta2.value = this.delta[1];
    this.blurTextures[1].render();

    this.renderMaterial.uniforms.texture1.value = this.blurTextures[0].getTexture();
    this.renderMaterial.uniforms.texture2.value = this.blurTextures[1].getTexture();

    this.blurTextures[0].swap();
    this.blurTextures[1].swap();

    this.blurTextures[0].setMaterial(this.renderMaterial);
    this.blurTextures[0].render();

    this.renderTexture = this.blurTextures[0].getTexture();
  }

  public setPower(power) {
    this.renderMaterial.uniforms.power.value = power;
  }

  public setAngle(angle) {
    this.angle = angle;
    this.calculateDelta();
  }

  public setRadius(radius) {
    this.radius = radius;
    this.calculateDelta();
  }

  protected calculateDelta() {
    this.delta = [];
    let a;
    for (let i = 0; i < 3; i++) {
      a = this.angle + i * Math.PI * 2 / 3;
      this.delta.push(new Vector2(this.radius * Math.sin(a) / this.width, this.radius * Math.cos(a) / this.height));
    }

    this.renderMaterial.uniforms.delta1.value = this.delta[1];
    this.renderMaterial.uniforms.delta2.value = this.delta[2];
  }

  public getRenderTexture() {
    return this.renderTexture;
  }
}