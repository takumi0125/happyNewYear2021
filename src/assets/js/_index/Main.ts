const g:any = window[ENV.projectName] = window[ENV.projectName] || {};

import gsap, { Cubic, Expo } from 'gsap/src/gsap-core';
import { CSSPlugin } from 'gsap/src/CSSPlugin';
gsap.registerPlugin(CSSPlugin);

import RootLoading from '../_modules/RootLoading';
import Menu, { MenuButton } from '../_modules/Menu';

import { mainStore } from '../_store/main';
import MainVisual from '../_modules/webgl/MainVisual';

export default class Main {
  public bodyElm: HTMLBodyElement = document.body as HTMLBodyElement;
  public htmlElm: HTMLHtmlElement = this.bodyElm.parentElement as HTMLHtmlElement;
  public contentsElm: HTMLElement = this.bodyElm.querySelector('.js-contents') as HTMLElement;

  protected menu!: Menu;
  protected mainVisual!: MainVisual;
  protected isNoWebGL: boolean = false;

  constructor() {
    this.init();

  }

  protected async init(): Promise<void> {
    await Promise.all([
      g.loadFontPromise,
      this.initLoading(),
      this.initWebGL()
      .catch((e)=> {
        this.isNoWebGL = true;
        this.bodyElm.classList.add('is-noWebGL');
      }),
      this.initMenu(),
    ]);

    this.initResize();
    this.resizeHandler();

    mainStore.setIsRootLoaded(true);

    this.mainVisual.start();
  }

  protected async initWebGL() {
    const el = this.bodyElm.querySelector('.js-main') as HTMLElement;
    this.mainVisual = new MainVisual(el, el.querySelector('canvas') as HTMLCanvasElement);
    await this.mainVisual.init()
  }

  protected async initLoading(): Promise<void> {
    const rootLoading: RootLoading = new RootLoading({
      el: this.bodyElm.querySelector('.js-rootLoading') as Element,
    });
    await rootLoading.$nextTick();
  }

  protected async initMenu(): Promise<void> {
    this.menu = new Menu({
      el: this.bodyElm.querySelector('.js-info') as Element,
    });
    const menuButton = new MenuButton({
      el: this.bodyElm.querySelector('.js-infoButton') as Element,
    });
    await Promise.all([
      await this.menu.$nextTick(),
      await menuButton.$nextTick(),
    ]);
  }


  // init resize action
  protected initResize() {
    this.resizeHandler = this.resizeHandler.bind(this);
    window.addEventListener('resize', this.resizeHandler, { passive: true });
  }

  protected resizeHandler(e?: Event): void {
    this.mainVisual?.onResize();
  }
}