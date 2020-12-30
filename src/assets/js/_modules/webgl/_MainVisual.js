const ENV = require('../../_env');
const g = window[ENV.projectName] = window[ENV.projectName] || {};

import { vec2, vec3 } from 'gl-matrix'

import Renderer from '../unshiftWebGL/renderers/Renderer'
import PerspectiveCamera from '../unshiftWebGL/cameras/PerspectiveCamera'
import Mesh from '../unshiftWebGL/objects/Mesh'
import Material from '../unshiftWebGL/core/Material'
import PlaneGeometry from '../unshiftWebGL/geometries/PlaneGeometry'
import Color from '../unshiftWebGL/math/Color'
import Texture from '../unshiftWebGL/textures/Texture';
import RenderTarget from '../unshiftWebGL/renderers/RenderTarget';

import HexagonalBokeh from './HexagonalBokeh';
import CircularBokeh from './CircularBokeh';
import GaussianBokeh from './GaussianBokeh';

export default Vue.extend({
  data() {
    return {
      width: 0,
      height: 0,
      brightness: 0,
      animationId: null,

      currentIndex: 0,
      beforeIndex: 0,

      canvas: null,
      renderer: null,
      gl: null,
      camera: null,
      rootObject: null,
      isNoWebGL: true,
      isInited: false,
      isStarted: false,
      beforeIndex: 0,
      currentIndex: 0,
      devicePixelRatio: 1,
      startTime: 0,
      texturesData: {},
      textureData: {},
      layoutMode: ''
    }
  },

  computed: {
    classObj() {
      return {
        'is-started': this.isStarted,
        'is-noWebGL': this.isNoWebGL,
        'is-layoutModeS': this.$store.state.layoutMode == 's'
      }
    },

    styleObj() {
      return { height: `${this.height}px` }
    }
  },

  beforeDestroy() {
    if(this.animationId) cancelAnimationFrame(this.animationId);
    this.playTween && this.playTween.kill();

    if(!this.isNoWebGL) {
      this.planeGeometry.dispose();
      this.sceneMesh.dispose(true);
      this.renderMesh.dispose(true);
      this.rootObject.dispose(true);
      this.renderer.dispose();
      this.hexagonalBokeh.dispose();
      let texture;
      for (let i = 0, l = this.textureData.imgs.length; i < l; i++) {
        texture = this.texturesData.s.textures[i];
        texture && texture.dispose();
        texture = this.texturesData.l.textures[i];
        texture && texture.dispose();
      }
    }

    this.textureData = null;
    this.texturesData = null;
  },

  mounted() {
    this.canvas = this.$refs.canvas;
  },

  methods: {
    async init(texturesData, layoutMode) {
      if(this.isInited) return;

      this.layoutMode = layoutMode;

      this.texturesData = texturesData;
      this.texturesData.s.textures = [];
      this.texturesData.l.textures = [];

      this.textureData = this.texturesData[this.layoutMode];

      this.calcTextureAspectRatio('s');
      this.calcTextureAspectRatio('l');

      this.width = this.$store.state.windowWidth;
      this.height = this.$store.state.windowHeight;

      await this.initWebGL()
      // this.isNoWebGL = true;

      this.onResize(this.layoutMode, true);
      await Vue.nextTick();
    },

    calcTextureAspectRatio(layoutMode) {
      const data = this.texturesData[layoutMode];
      data.aspectRatio = data.orgResolution[0] / data.orgResolution[1];
    },

    async initWebGL() {
      this.isInited = true;

      // nowebgl test
      // return;

      return new Promise(async (resolve, reject)=> {
        //
        // renderer
        //
        this.devicePixelRatio = window.devicePixelRatio;
        this.devicePixelRatio = 1;
        this.renderer = new Renderer({
          canvas: this.canvas,
          devicePixelRatio: this.devicePixelRatio,
          antialias: true
        });
        this.renderer.setBgColor(new Color(0, 0, 0), 0);
        this.gl = this.renderer.getGLContext();

        if(!this.gl) {
          this.isNoWebGL = true;
          return reject();
        }

        //
        // camera
        //
        this.camera = new PerspectiveCamera(45 / 180 * Math.PI, 1, 0.1, 100);
        this.cameraDefaultPos = vec3.clone(this.camera.position);
        this.camera.lookAt(0, 0, 0);

        //
        // texture
        //

        await this.initTextures();


        this.planeGeometry = new PlaneGeometry(100, 100);
        const power = this.getPower(this.brightness);

        // bokeh
        this.hexagonalBokeh = new HexagonalBokeh();
        this.hexagonalBokeh.init(this.gl, this.renderer, this.planeGeometry, this.width, this.height, 30, 0, 1 / power);

        // this.gaussianBokeh = new GaussianBokeh();
        // this.gaussianBokeh.init(this.gl, this.renderer, this.planeGeometry, this.width, this.height, 90, 1 / power);

        // this.circularBokeh = new CircularBokeh();
        // this.circularBokeh.init(this.gl, this.renderer, this.planeGeometry, this.width, this.height, 30, 1 / power);

        // main scene
        this.sceneMaterial = new Material({
          vertexShader: require('./_glsl/common.vert'),
          fragmentShader: require('./_glsl/scene.frag'),
          depthTest: false,
          uniforms: {
            resolution: { type: 'uniform2f', value: [0,0] },
            uvOffset: { type: 'uniform2f', value: [0,0] },
            uvSize: { type: 'uniform2f', value: [1,1] },
            texture1: { type: 'texture', value: this.texture1 },
            texture2: { type: 'texture', value: this.texture2 },
            time: { type: 'uniform1f', value: 0 },
            isLoaded: { type: 'uniform1f', value: 1 },
            animationValue: { type: 'uniform1f', value: 1 },
            alpha: { type: 'uniform1f', value: 0 },
            power: { type: 'uniform1f', value: power }
          }
        });
        this.sceneMesh = new Mesh(this.planeGeometry, this.sceneMaterial);
        this.sceneMesh.setGLContext(this.gl);
        this.sceneRenderTarget = new RenderTarget(this.gl, this.width, this.height, {
          wrapS: 'CLAMP_TO_EDGE',
          wrapT: 'CLAMP_TO_EDGE',
          minFilter: 'LINEAR',
          magFilter: 'LINEAR',
          type: 'FLOAT'
        });

        // render
        this.renderMaterial = new Material({
          vertexShader: require('./_glsl/common.vert'),
          fragmentShader: require('./_glsl/render.frag'),
          depthTest: false,
          uniforms: {
            resolution: { type: 'uniform2f', value: [0,0] },
            texture: { type: 'texture', value: null }
          }
        });
        this.renderMesh = new Mesh(this.planeGeometry, this.renderMaterial);
        this.renderMesh.setGLContext(this.gl);

        // this.initDatGUI();

        this.onResize();

        console.log('webgl inited');
        this.isNoWebGL = false;
        resolve();
      })
      .catch((error)=> {
        this.isNoWebGL = true;
        console.error(error);
      });
    },

    async initTexture(index) {
      const texture = new Texture({ type: 'FLOAT' });
      this.textureData.textures[index] = texture;
      await texture.load(this.textureData.imgs[index]);
      return texture.setGLContext(this.gl);
    },

    async initTextures() {
      const promises = [];
      for (let i = 0, l = this.textureData.imgs.length; i < l; i++) {
        promises.push(this.initTexture(i));
      }
      await Promise.all(promises);
      this.textureData.isLoaded = true;
      this.texture1 = this.textureData.textures[this.beforeIndex];
      this.texture2 = this.textureData.textures[this.currentIndex];
      this.texture1.needsUpdate = true;
      this.texture2.needsUpdate = true;
    },

    setTexture() {
      if(this.isNoWebGL || this.beforeIndex == this.currentIndex) return;
      this.texture1 = this.textureData.textures[this.beforeIndex];
      this.texture2 = this.textureData.textures[this.currentIndex];
      this.texture1.needsUpdate = true;
      this.texture2.needsUpdate = true;
      this.sceneMaterial.uniforms.texture1.value = this.texture1;
      this.sceneMaterial.uniforms.texture2.value = this.texture2;
      // this.plane.updateTextureUnitIndicies();
      this.play();
      this.beforeIndex = this.currentIndex;
    },

    goTo(index) {
      if(index == this.currentIndex) return;
      this.currentIndex = index;
      this.setTexture();
    },

    goNext() {
      const index = (this.currentIndex + 1) % this.textureData.imgs.length;
      this.goTo(index);
    },

    goPrev() {
      const index = (this.currentIndex - 1 + this.textureData.imgs.length) % this.textureData.imgs.length;
      this.goTo(index);
    },

    start() {
      if(this.isNoWebGL) return;
      // this.sceneMaterial.uniforms.alpha.value = 1;
      // this.sceneMaterial.uniforms.animationValue.value = 1;
      // this.render();

      this.goNext();

      window.goNext = this.goNext.bind(this);
      window.goPrev = this.goPrev.bind(this);
      document.addEventListener('keydown', (e)=> {
        if(e.key == 'Enter') this.goNext();
      })
    },

    play(isFirst = false) {
      this.isStarted = true;
      this.startTime = new Date().getTime() + Math.random() * 40000;
      if(this.isNoWebGL) return;

      this.sceneMaterial.uniforms.animationValue.value = 0;
      if(this.playTween) this.playTween.kill();

      const radius = 60;

      this.playTween = new TimelineMax({
        onUpdate: ()=> {
          this.render();
          this.hexagonalBokeh.setAngle(this.time * -0.0004);
        }
      })
      .to(this.sceneMaterial.uniforms.animationValue, 2, { value: 1, ease: Linear.easeNone })
      .fromTo(this, 0.8, { radius: 0 }, {
        brightness: 1,
        ease: Sine.easeOut,
        onUpdate: ()=> {
          this.radius = this.brightness * radius;
          const power = this.getPower(this.brightness);
          this.hexagonalBokeh.setRadius(this.radius);
          this.hexagonalBokeh.setPower(1 / power);
          this.sceneMaterial.uniforms.power.value = power;
        }
      }, 0)
      .to(this, 2, {
        brightness: 0,
        ease: Expo.easeInOut,
        onUpdate: ()=> {
          this.radius = this.brightness * radius;
          const power = this.getPower(this.brightness);
          this.hexagonalBokeh.setRadius(this.radius);
          this.hexagonalBokeh.setPower(1 / power);
          this.sceneMaterial.uniforms.power.value = power;
        }
      }, 0.8);
    },

    getPower(brightness) {
      const power = Math.pow(10, brightness);
      return power;
    },

    initDatGUI() {
      const dat = require('dat.gui');
      this.gui = new dat.GUI();
      this.gui.domElement.parentElement.style.zIndex = 100000;

      this.animationValue = this.sceneMaterial.uniforms.animationValue.value;
      this.gui.add(this, 'animationValue', 0, 1, this.animationValue).step(0.01)
      .onChange((value)=> {
        this.sceneMaterial.uniforms.animationValue.value = value;
        this.render();
      });

      this.radius = 30;
      this.gui.add(this, 'radius', 1, 200, this.radius).step(1)
      .onChange((value)=> {
        this.hexagonalBokeh.setRadius(value);
        // this.circularBokeh.setRadius(value);
        this.render();
      });

      this.gui.add(this, 'brightness', -1, 1, this.brightness).step(0.01)
      .onChange((value)=> {
        const power = this.getPower(value);
        this.hexagonalBokeh.setPower(1 / power);
        // this.gaussianBokeh.setPower(1 / power);
        // this.circularBokeh.setPower(1 / power);
        this.sceneMaterial.uniforms.power.value = power;
        this.render();
      });

      this.angle = 0;
      this.gui.add(this, 'angle', 0, 2 * Math.PI, this.angle).step(0.01)
      .onChange((value)=> {
        this.hexagonalBokeh.setAngle(value);
        this.render();
      });

      // this.gaussianBlurStrength = 0;
      // this.gui.add(this, 'gaussianBlurStrength', 0, 200, this.gaussianBlurStrength).step(0.01)
      // .onChange((value)=> {
      //   // this.gaussianBokeh.setStrength(value);
      //   this.render();
      // });
      return;
    },

    render() {
      if(this.isLoadingTexture) return;
      this.time = new Date().getTime() - this.startTime;
      this.camera.lookAt(0, 0, 0);
      this.sceneMaterial.uniforms.time.value = this.time * 0.0006;

      this.renderer.render(this.sceneMesh, this.sceneRenderTarget);

      this.hexagonalBokeh.update(this.sceneRenderTarget);
      // this.gaussianBokeh.update(this.sceneRenderTarget);
      // this.circularBokeh.update(this.sceneRenderTarget);

      this.renderMaterial.uniforms.texture.value = this.hexagonalBokeh.getRenderTexture();
      // this.renderMaterial.uniforms.texture.value = this.gaussianBokeh.getRenderTexture();
      // this.renderMaterial.uniforms.texture.value = this.circularBokeh.getRenderTexture();
      this.renderer.render(this.renderMesh);
    },

    async onResize(layoutMode = '', force = false) {
      if(!this.isInited) return;

      // swap texture
      if(layoutMode) {
        if(this.layoutMode !== layoutMode || force) {
          this.layoutMode = layoutMode;
          this.textureData = this.texturesData[this.layoutMode];

          if(!this.isNoWebGL) {
            if(this.textureData.isLoaded) {
              this.texture1 = this.textureData.textures[this.beforeIndex];
              this.texture1.needsUpdate = true;
              this.texture2 = this.textureData.textures[this.currentIndex];
              this.texture2.needsUpdate = true;
              // this.plane.updateTextureUnitIndicies();

            } else {
              this.sceneMaterial.uniforms.isLoaded.value = 0;
              this.sceneMaterial.uniforms.texture.value = null;
              // this.plane.updateTextureUnitIndicies();
              this.render();
              this.isLoadingTexture = true;
              await this.initTextures();
              this.sceneMaterial.uniforms.isLoaded.value = 1;
              this.isLoadingTexture = false;
            }

            this.sceneMaterial.uniforms.texture1.value = this.texture1;
            this.sceneMaterial.uniforms.texture2.value = this.texture2;
          }
        }
      }

      this.width = this.$store.state.windowWidth;
      const textureAspectRatio = this.textureData.aspectRatio;
      const aspectRatio = Math.max(this.textureData.minAspectRatio, Math.min(this.textureData.maxAspectRatio, this.$store.state.windowWidth / this.$store.state.windowHeight));
      this.height = this.width / aspectRatio;

      let tw, th, size;
      const uvSize = [1,1];
      const uvOffset = [0, 0];

      if(textureAspectRatio > aspectRatio) {
        // 画面よりもテクスチャが横長
        th = this.height;
        tw = th * textureAspectRatio;
        size = this.width / tw;
        uvSize[0] = size;
        uvOffset[0] = (1.0 - size) * 0.5;

      } else {
        // 画面よりもテクスチャが縦長
        tw = this.width;
        th = tw / textureAspectRatio;
        size = this.height / th;
        uvSize[1] = size;
        uvOffset[1] = (1.0 - size) * 0.5;
      }

      if(!this.isNoWebGL) {

        this.renderer.setSize(this.width, this.height);
        this.sceneRenderTarget.setSize(this.width, this.height);

        this.hexagonalBokeh.setSize(this.width, this.height);
        // this.gaussianBokeh.setSize(this.width, this.height);
        // this.circularBokeh.setSize(this.width, this.height);

        const texRes = this.sceneRenderTarget.getTextureResolution();

        this.sceneMaterial.uniforms.resolution.value[0] = texRes.x;
        this.sceneMaterial.uniforms.resolution.value[1] = texRes.y;
        this.sceneMaterial.uniforms.uvOffset.value = uvOffset;
        this.sceneMaterial.uniforms.uvSize.value = uvSize;

        this.renderMaterial.uniforms.resolution.value[0] = this.width * this.devicePixelRatio;
        this.renderMaterial.uniforms.resolution.value[1] = this.height * this.devicePixelRatio;

        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();

        this.render();
      }
    }
  }
});