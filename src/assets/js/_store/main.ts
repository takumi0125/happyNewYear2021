import { VuexModule, Module, Mutation, getModule } from 'vuex-module-decorators'
import store from './';

export type MainState = {
  isRootLoaded: boolean;
  isMenuOpened: boolean;
  isScrollLocked: boolean;
  isWebGLAvailable: boolean;
}

@Module({ dynamic: true, store, name: 'app' })
export default class Main extends VuexModule implements MainState {
  public isRootLoaded = false;
  public isMenuOpened = false;
  public isScrollLocked = false;
  public isWebGLAvailable = false;

  @Mutation
  public setIsRootLoaded(isRootLoaded: boolean): void {
    this.isRootLoaded = isRootLoaded;
  }

  @Mutation
  public setIsMenuOpened(isMenuOpened: boolean): void {
    this.isMenuOpened = isMenuOpened;
  }

  @Mutation
  public setIsScrollLocked(isScrollLocked: boolean): void {
    this.isScrollLocked = isScrollLocked;
  }

  @Mutation
  public setIsWebGLAvailable(isWebGLAvailable: boolean): void {
    this.isWebGLAvailable = isWebGLAvailable;
  }
}


export const mainStore = getModule(Main);