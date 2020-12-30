import { WebGL1Renderer      } from 'three/src/renderers/WebGL1Renderer'       ;
import { Camera              } from 'three/src/cameras/Camera'                 ;
import { Color               } from 'three/src/math/Color'                     ;
import { Scene               } from 'three/src/scenes/Scene'                   ;
import { Texture             } from 'three/src/textures/Texture'               ;
import { TextureLoader       } from 'three/src/loaders/TextureLoader'          ;
import { Object3D            } from 'three/src/core/Object3D'                  ;
import { Mesh                } from 'three/src/objects/Mesh'                   ;
import { Material            } from 'three/src/materials/Material'             ;
import { LinearFilter        } from 'three/src/constants'                      ;
import { Vector2             } from 'three/src/math/Vector2'                   ;
import { PlaneBufferGeometry } from 'three/src/geometries/PlaneBufferGeometry' ;
import { PerspectiveCamera   } from 'three/src/cameras/PerspectiveCamera'      ;

import { WEBGL } from 'three/examples/jsm/WebGL';

export default class WebGLBase {
  public static commonPlaneGeometry: PlaneBufferGeometry = new PlaneBufferGeometry(100, 100);

  public container!: HTMLElement;
  public isNoWebGL!: boolean;
  protected canvas!: HTMLCanvasElement;

  protected devicePixelRatio: number = 1;

  protected renderer?: WebGL1Renderer;
  protected scene?: Scene;
  protected camera?: Camera;

  protected width: number = 1;
  protected height: number = 1;
  protected startTime: number = 0;
  protected time: number = 0;

  protected animationId: number = 0;
  protected isDisposed: boolean = false;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.canvas = canvas;
  }

  public static async initImgTexture(imgSrc: string): Promise<Texture>  {
    return new Promise((resolve)=> {
      const loader: TextureLoader = new TextureLoader();
      // loader.crossOrigin = 'https://0.0.0.0:50000';
      loader.load(imgSrc, (texture: Texture)=> {
        texture.generateMipmaps = false;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.needsUpdate = true;
        resolve(texture);
      });
    });
  }

  public async init(): Promise<any> {
    this.isNoWebGL = !WEBGL.isWebGLAvailable();

    if(this.isNoWebGL) {
    // if(this.isNoWebGL || g.isIE11) {
      throw Error('not support webgl');
    }

    await this.initWebGL();
  }

  protected async initContents(): Promise<any> {}

  protected beforeRenderContents() {}

  protected afterRenderContents() {}

  protected onResizeContents() {
  }

  protected updateCamera() {
    const camera = this.camera as PerspectiveCamera;
    camera.aspect = this.width / this.height;
    camera.updateProjectionMatrix();
  }

  public initDatGUI(datGUI: any) {}

  protected initRenderer() {
    this.renderer = new WebGL1Renderer({
      canvas: this.canvas,
      // antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(this.devicePixelRatio);
    this.renderer.setClearColor(new Color(0, 0, 0), 0);
  }

  protected initCamera() {
    this.camera = new PerspectiveCamera(45, this.width / this.height, 1, 10000);
    this.camera.position.z = 500;
    this.camera.lookAt(0, 0, 0);
  }

  public setPixelRatio(devicePixelRatio: number, render: boolean = false) {
    if(this.isNoWebGL || this.isDisposed || !this.renderer ) return;
    this.devicePixelRatio = devicePixelRatio;
    this.renderer.setPixelRatio(this.devicePixelRatio);
    if(render) this.onResize();
  }

  protected async initWebGL(): Promise<any> {
    console.log('init webgl');

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.devicePixelRatio = window.devicePixelRatio;

    // renderer
    this.initRenderer()

    // camera
    this.initCamera();

    // scene
    this.scene = new Scene();
    this.scene.matrixAutoUpdate = false;
    this.scene.matrixWorldNeedsUpdate = true;

    this.update = this.update.bind(this);

    await this.initContents();
    console.log('init contents');
  }

  protected update() {
    this.animationId = requestAnimationFrame(this.update);
    this.render();
  }

  public start() {
    if(this.isNoWebGL || this.isDisposed) return;
    this.stop();
    this.startTimeUpdate();
    this.update();
  }

  public startTimeUpdate() {
    this.startTime = new Date().getTime()
  }

  public stop() {
    if(this.animationId) cancelAnimationFrame(this.animationId);
  }

  public render() {
    if(this.isNoWebGL || this.isDisposed || !this.renderer ) return;

    this.time = new Date().getTime() - this.startTime;

    this.beforeRenderContents();
    this.renderer?.render(this.scene as Scene, this.camera as Camera);
    this.afterRenderContents();
  }

  public onResize(width: number = 0, height: number = 0) {
    if(this.isNoWebGL || this.isDisposed || !this.camera || !this.renderer) return;

    this.width = width || this.container.offsetWidth || 1;
    this.height = height || this.container.offsetHeight || 1;

    this.renderer.setSize(this.width, this.height);

    this.updateCamera();

    this.onResizeContents();

    this.render();
  }

  public getUV( width: number, height: number, textureWidth: number, textureHeight: number) {
    const aspectRatio = width / height;
    const textureAspectRatio = textureWidth / textureHeight;
    const uvSize = new Vector2(1, 1);
    const uvOffset = new Vector2(0, 0);

    if(aspectRatio > textureAspectRatio) {
      uvSize.y = height / textureHeight;
      uvOffset.y = (1 - uvSize.y) * 0.5;
    } else {
      uvSize.x = width / textureWidth;
      uvOffset.x = (1 - uvSize.x) * 0.5;
    }

    return { uvSize, uvOffset }
  }

  public disposeObject3D(object: Object3D | Mesh) {
    if(object.children && object.children.length > 0) {
      let child: Object3D | Mesh;
      while(child = object.children[0]) {
        this.disposeObject3D(child);
        object.remove(child);
      }
    }

    if(!(object instanceof Mesh)) return;

    object.geometry.dispose();

    if(object.material instanceof Material) {
      object.material.dispose();
    }
  }

  public dispose() {
    if(this.isDisposed) return;
    this.stop();
    this.disposeObject3D(this.scene as Scene);
    this.renderer?.dispose();
    delete this.scene;
    delete this.camera;
    delete this.renderer;
    this.isDisposed = true;
  }
}
