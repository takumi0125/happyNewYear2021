import { WebGL1Renderer    } from 'three/src/renderers/WebGL1Renderer'            ;
import { PlaneGeometry     } from 'three/src/geometries/PlaneGeometry'            ;
import { Mesh              } from 'three/src/objects/Mesh'                        ;
import { Scene             } from 'three/src/scenes/Scene'                        ;
import { RawShaderMaterial } from 'three/src/materials/RawShaderMaterial'         ;
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'           ;
import { WebGLRenderTarget } from 'three/src/renderers/WebGLRenderTarget'         ;
import { Vector2           } from 'three/src/math/Vector2'                        ;
import { DepthTexture      } from 'three/src/textures/DepthTexture'               ;
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls' ;
import { FontLoader } from 'three/src/loaders/FontLoader';
import { TextBufferGeometry } from 'three/src/geometries/TextBufferGeometry';
import { BufferGeometry } from 'three/src/core/BufferGeometry';
import { BufferAttribute } from 'three/src/core/BufferAttribute';
import { Box3 } from 'three/src/math/Box3';

import { DepthFormat } from 'three/src/constants';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';

import HexagonalBokeh from './HexagonalBokeh';
import WebGLBase from './WebGLBase';

import gsap, { Expo } from 'gsap/src/gsap-core';

const FONT_DATA = [
  '/assets/font/Luckiest_Guy_Regular.json',
  '/assets/font/Bungee_Regular.json',
  '/assets/font/Wendy_One_Regular.json',
];
const FONT_SIZE = 80;

const MESSAGE = 'Happy New Year 2021! Wishing you good health and happiness!  ';
// const MESSAGE = 'HAPPY NEW YEAR 2021! WISHING YOU GOOD HEALTH AND HAPPINESS!  ';

export default class MainVisual extends WebGLBase {
  protected hexagonalBokehLevel1!: HexagonalBokeh;
  protected hexagonalBokehLevel2!: HexagonalBokeh;

  protected commonPlaneGeometry: PlaneGeometry = new PlaneGeometry(100, 100);

  protected renderMesh!: Mesh;
  protected renderMaterial!: RawShaderMaterial;
  protected renderTarget!: WebGLRenderTarget;
  protected controls!: TrackballControls;

  protected mainObj!: Mesh;
  protected mainObjMaterial!: RawShaderMaterial;

  protected pointerPos: Vector2 = new Vector2();
  protected beforePointerPos: Vector2 = new Vector2();
  protected isPointerMoved: boolean = false;
  protected isPointerDown: boolean = false;
  protected scrollTweenObj: { value: number } = { value: 0 };
  protected scroll: number = 0;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    super(container, canvas);
  }

  protected initRenderer() {
    super.initRenderer();

    const gl = (this.renderer as WebGL1Renderer).getContext();
    if(!gl || (!gl.getExtension('WEBGL_depth_texture') && !gl.getExtension('WEBKIT_WEBGL_depth_texture'))) {
      this.isNoWebGL = true;
      throw Error('not support webgl extension');
    }
  }


  protected async initContents(): Promise<any> {
    if(this.isNoWebGL) return;

    this.renderer?.setClearColor(0xffd1d1);
    // this.setPixelRatio(1);

    this.hexagonalBokehLevel1 = new HexagonalBokeh();
    this.hexagonalBokehLevel2 = new HexagonalBokeh();

    this.hexagonalBokehLevel1.init(this.renderer as WebGL1Renderer, this.commonPlaneGeometry, this.width, this.height, 8, 0, 1);
    this.hexagonalBokehLevel2.init(this.renderer as WebGL1Renderer, this.commonPlaneGeometry, this.width, this.height, 16, 0, 1);

    // render
    this.renderMaterial = new RawShaderMaterial({
      depthTest: false,
      depthWrite :false,
      transparent: true,
      vertexShader: require('./glsl/plane.vert').default,
      fragmentShader: require('./glsl/render.frag').default,
      uniforms: {
        depthTexture: { value: null },
        texture: { value: null },
        textureBlurLevel1: { value: null },

        textureBlurLevel2: { value: null },
        cameraNear: { value: (this.camera as PerspectiveCamera).near },
        cameraFar: { value: (this.camera as PerspectiveCamera).far },
        resolution: { value: new Vector2() },
        focusOffset: { value: 0.1 },
      }
    });
    this.renderMesh = new Mesh(this.commonPlaneGeometry, this.renderMaterial);
    this.renderMesh.matrixAutoUpdate = false;
    this.renderMesh.matrixWorldNeedsUpdate = true;
    (this.scene as Scene).add(this.renderMesh);

    this.renderTarget = new WebGLRenderTarget(this.width, this.height);
    this.renderTarget.depthBuffer = true;
    this.renderTarget.depthTexture = new DepthTexture(this.width, this.height);
    this.renderTarget.depthTexture.format = DepthFormat;

    // this.controls = new TrackballControls(this.camera as PerspectiveCamera, this.renderer?.domElement);

    await this.initMainObj();
  }

  protected async initMainObj() {
    const loader = new FontLoader();
    const font = await loader.loadAsync(FONT_DATA[2]);
    // const modifier = new TessellateModifier(2, 2);
    const interval = FONT_SIZE * 2;

    const geometry = new BufferGeometry();
    const vertices       : number[] = [];
    const offsets        : number[] = [];
    const uvs            : number[] = [];
    const indices        : number[] = [];
    const instanceIndices: number[] = [];


    for (let i = 0, l = MESSAGE.length; i < l; i++) {
      // const char = MESSAGE.charAt(i).toUpperCase();
      const char = MESSAGE.charAt(i);
      if(char === ' ') continue;

      const charGeometry = new TextBufferGeometry(char, {
        font: font,
        size: FONT_SIZE,
        height: FONT_SIZE * 0.5,
        curveSegments: 2,
        // bevelEnabled: true,
        // bevelThickness: 1,
        // bevelSize: 1,
        // bevelOffset: 0,
        // bevelSegments: 4
      });
      charGeometry.computeBoundingBox();
      const boundingBox = charGeometry.boundingBox as Box3;
      const offsetX = (boundingBox.max.x - boundingBox.min.x) * -0.5;

      const baseBufferGeometryPositions = charGeometry.attributes.position.array;
      const numInstancePositions = baseBufferGeometryPositions.length / 3;
      const baseBufferGeometryIndices = charGeometry?.index?.array || [];
      const baseBufferGeometryUVs = charGeometry.attributes.uv.array;

      for (let j = 0, l2 = numInstancePositions; j < l2; j++) {
        vertices.push(baseBufferGeometryPositions[j * 3 + 0] + offsetX);
        vertices.push(baseBufferGeometryPositions[j * 3 + 1]);
        vertices.push(baseBufferGeometryPositions[j * 3 + 2]);
        offsets.push(0);
        offsets.push(-FONT_SIZE * 0.5);
        offsets.push((-i - 1) * interval);
        uvs.push(baseBufferGeometryUVs[j * 2 + 0]);
        uvs.push(baseBufferGeometryUVs[j * 2 + 1]);
        // randomValues.push(randomValues[0]);
        // randomValues.push(randomValues[1]);
        // randomValues.push(randomValues[2]);
        instanceIndices.push(i);
      }
      for (let j = 0, l2 = numInstancePositions; j < l2; j++) {
        indices.push(baseBufferGeometryIndices[j] + numInstancePositions * i);
      }
    }

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('offset', new BufferAttribute(new Float32Array(offsets), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    geometry.setAttribute('instanceIndex', new BufferAttribute(new Uint16Array(instanceIndices), 1));
    // geometry.setAttribute('randomValues', new BufferAttribute(new Float32Array(randomValues), 3));
    // geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));
    geometry.computeVertexNormals();

    this.mainObjMaterial = new RawShaderMaterial({
      vertexShader: require('./glsl/mainObj.vert').default,
      fragmentShader: require('./glsl/mainObj.frag').default,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        numChars: { value: MESSAGE.length },
        interval: { value: interval },
        loopOffset: { value: 500 },
        scroll: { value: 0 },
        scrollDelta: { value: 0 }
      }
    });
    this.mainObj = new Mesh(geometry, this.mainObjMaterial);
    this.mainObj.frustumCulled = false;
    this.mainObj.matrixAutoUpdate = false;
    this.mainObj.matrixWorldNeedsUpdate = true;

    (this.scene as Scene).add(this.mainObj);

    this.camera?.position.set(90, 80, 300);
    this.camera?.lookAt(0, 0, 0);

    // interaction
    const el = this.renderer?.domElement as HTMLElement;
    el.addEventListener('touchstart', (e: TouchEvent)=> {
      const touch = e.touches[0];
      this.onPointerDown(touch.clientX, touch.clientY);
      if(e.cancelable) e.preventDefault();
    }, { passive: false })

    el.addEventListener('touchmove', (e: TouchEvent)=> {
      const touch = e.touches[0];
      this.onPointerMove(touch.clientX, touch.clientY);
      if(e.cancelable) e.preventDefault();
    }, { passive: false })

    el.addEventListener('touchend', (e: TouchEvent)=> {
      this.onPointerUp();
      if(e.cancelable) e.preventDefault();
    }, { passive: false })

    el.addEventListener('mousedown', (e: MouseEvent)=> {
      this.onPointerDown(e.clientX, e.clientY);
      if(e.cancelable) e.preventDefault();
    }, { passive: false })

    el.addEventListener('mousemove', (e: MouseEvent)=> {
      if(this.isPointerDown) this.onPointerMove(e.clientX, e.clientY);
      if(e.cancelable) e.preventDefault();
    }, { passive: false })

    el.addEventListener('mouseup', (e: MouseEvent)=> {
      this.onPointerUp();
      if(e.cancelable) e.preventDefault();
    }, { passive: false })


    el.addEventListener('wheel', (e: WheelEvent)=> {
      gsap.killTweensOf(this.scrollTweenObj);
      this.scrollTweenObj.value = e.deltaY;
      gsap.to(this.scrollTweenObj, { duration: 1, value: 0, ease: Expo.easeOut });
    });
  }

  protected onPointerDown(pointerPosX: number, pointerPosY: number) {
    gsap.killTweensOf(this.scrollTweenObj);
    this.isPointerDown = true;
    this.isPointerMoved = false;
    this.beforePointerPos.x = pointerPosX;
    this.beforePointerPos.y = pointerPosY;
    this.pointerPos.x = pointerPosX;
    this.pointerPos.y = pointerPosY;
  }

  protected onPointerMove(pointerPosX: number, pointerPosY: number) {
    gsap.killTweensOf(this.scrollTweenObj);
    this.isPointerMoved = true;
    const dX = pointerPosX - this.beforePointerPos.x;
    const dy = pointerPosY - this.beforePointerPos.y;
    this.pointerPos.x = pointerPosX;
    this.pointerPos.y = pointerPosY;
    this.beforePointerPos.x = pointerPosX;
    this.beforePointerPos.y = pointerPosY;

    gsap.to(this.scrollTweenObj, { duration: 0.4, value: -dy * 10, ease: Expo.easeOut });
  }

  protected onPointerUp() {
    this.isPointerDown = false;
    if(!this.isPointerMoved) {
      // tapped
    } else {
      gsap.to(this.scrollTweenObj, { duration: 1, value: 0, ease: Expo.easeOut });
    }
    this.isPointerMoved = false;
  }


  protected beforeRenderContents() {
    if(!this.renderer) return;

    this.scroll += this.scrollTweenObj.value;

    // // 通常シーンをrenderTargetへレンダリング
    this.mainObj.visible = true;
    this.mainObjMaterial.uniforms.time.value = this.time;
    this.mainObjMaterial.uniforms.scroll.value = this.scroll;
    this.mainObjMaterial.uniforms.scrollDelta.value = this.scrollTweenObj.value;
    this.renderMesh.visible = false;
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene as Scene, this.camera as PerspectiveCamera);

    // // 小さいボケのシーンをレンダリング
    this.hexagonalBokehLevel1.update(this.renderTarget.texture);

    // // 大きいボケのシーンをレンダリング
    this.hexagonalBokehLevel2.update(this.renderTarget.texture);

    // // 合成シーンをレンダリング
    this.mainObj.visible = false;
    this.renderMesh.visible = true;
    this.renderMaterial.uniforms.depthTexture.value = this.renderTarget.depthTexture;
    this.renderMaterial.uniforms.texture.value = this.renderTarget.texture;
    this.renderMaterial.uniforms.textureBlurLevel1.value = this.hexagonalBokehLevel1.getRenderTexture();
    this.renderMaterial.uniforms.textureBlurLevel2.value = this.hexagonalBokehLevel2.getRenderTexture();
    this.renderMaterial.needsUpdate = true;
    this.renderer.setRenderTarget(null);
    // this.renderer.render(this.scene as Scene, this.camera as PerspectiveCamera);

    // this.controls.update();
  }

  protected afterRenderContents() {}

  protected onResizeContents() {
    this.renderTarget.setSize(this.width, this.height);
    this.renderMaterial.uniforms.resolution.value.x = this.width * this.devicePixelRatio;
    this.renderMaterial.uniforms.resolution.value.y = this.height * this.devicePixelRatio;
    this.hexagonalBokehLevel1.onResize(this.width, this.height);
    this.hexagonalBokehLevel2.onResize(this.width, this.height);
  }
}
