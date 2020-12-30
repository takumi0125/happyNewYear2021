const g:any = window[ENV.projectName] = window[ENV.projectName] || {};

import { Component, Vue, Ref } from 'vue-property-decorator';
import { mainStore } from '../_store/main';

import gsap, { Expo } from 'gsap/src/gsap-core';

@Component
export class MenuButton extends Vue {
  public get isMenuOpened(): boolean {
    return mainStore.isMenuOpened;
  }

  public get classObj() {
    return {
      'is-menuOpened': this.isMenuOpened,
    }
  }

  public get ariaExpanded() {
    return this.isMenuOpened? 'true': 'false';
  }

  public onClick() {
    mainStore.setIsMenuOpened(!mainStore.isMenuOpened);
  }

  public get isDisabled() {
    return mainStore.isMenuOpened || mainStore.isScrollLocked;
  }
}

@Component
export default class Menu extends Vue {
  public get isOpened(): boolean {
    return mainStore.isMenuOpened;
  }

  // computed
  public get classObj() {
    return {
      'is-opened': this.isOpened,
    }
  }

  public onClickClose() {
    mainStore.setIsMenuOpened(false);
  }
}