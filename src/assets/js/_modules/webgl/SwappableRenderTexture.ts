import { WebGLRenderTarget, WebGLRenderTargetOptions } from 'three/src/renderers/WebGLRenderTarget';

import { PlaneGeometry      } from 'three/src/geometries/PlaneGeometry'    ;
import { Mesh               } from 'three/src/objects/Mesh'                ;
import { WebGL1Renderer     } from 'three/src/renderers/WebGL1Renderer'    ;
import { RawShaderMaterial  } from 'three/src/materials/RawShaderMaterial' ;
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera'  ;
import { Scene              } from 'three/src/scenes/Scene'                ;
import { Vector2            } from 'three/src/math/Vector2'                ;
import { UnsignedByteType, FloatType } from 'three/src/constants';


export default class SwappableRenderTexture {
  protected currentTextureIndex: number = 0;
  protected updateMaterial!: RawShaderMaterial;
  protected renderer!: WebGL1Renderer;
  protected scene!: Scene;
  protected camera!: OrthographicCamera;
  protected plane!: Mesh;
  protected renderTargets: WebGLRenderTarget[] = [];
  protected width: number = 1;
  protected height: number = 1;

  constructor(
    width: number,
    height: number,
    renderer: WebGL1Renderer,
    updateMaterial: RawShaderMaterial,
    options: WebGLRenderTargetOptions = {},
    planeGeometry:PlaneGeometry | null = null
  ) {
    this.renderer = renderer;
    this.updateMaterial = updateMaterial;
    this.currentTextureIndex = 0;

    this.renderTargets = [
      new WebGLRenderTarget(width, height, options),
      new WebGLRenderTarget(width, height, options)
    ];
    // this.renderTargets[0].texture.flipY = false;
    this.renderTargets[0].texture.generateMipmaps = false;
    // this.renderTargets[1].texture.flipY = false;
    this.renderTargets[1].texture.generateMipmaps = false;
    // this.renderTargets[0].texture.needsUpdate = true;
    // this.renderTargets[1].texture.needsUpdate = true;

    if(!planeGeometry) planeGeometry = new PlaneGeometry(128, 128);

    this.width = width;
    this.height = height;
    const halfW = width * 0.5;
    const halfH = height * 0.5;
    this.camera = new OrthographicCamera(-halfW, halfW, halfH, -halfH, 0, 100);
    this.camera.position.z = 10;
    this.scene = new Scene();

    this.plane = new Mesh(planeGeometry, this.updateMaterial);
    this.plane.frustumCulled = false;
    this.plane.matrixAutoUpdate = false;
    this.scene.add(this.plane);
  }

  public render() {
    this.renderer.setRenderTarget(this.renderTargets[this.currentTextureIndex]);
    this.renderer.render(this.scene, this.camera);
  }

  public setMaterial(material: RawShaderMaterial) {
    this.updateMaterial = material;
    this.plane.material = this.updateMaterial;
    this.updateMaterial.needsUpdate = true;
  }

  public swap() {
    this.currentTextureIndex = (this.currentTextureIndex + 1) % 2;
  }

  public getTexture() {
    return this.getRenderTarget().texture;
  }

  public getTextureResolution() {
    return new Vector2(this.width, this.height);
  }

  public getRenderTarget() {
    return this.renderTargets[this.currentTextureIndex];
  }

  public setSize(width, height) {
    this.width = width;
    this.height = height;
    const halfW = width * 0.5;
    const halfH = height * 0.5;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfW;
    this.camera.updateProjectionMatrix();
    this.renderTargets[0].setSize(width, height);
    this.renderTargets[1].setSize(width, height);
  }

  public dispose() {
    this.renderTargets[0].dispose();
    this.renderTargets[1].dispose();
    this.updateMaterial.dispose();
  }
};
