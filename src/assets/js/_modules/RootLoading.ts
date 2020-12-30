import { Component, Vue, Prop } from 'vue-property-decorator';
import { mainStore } from '../_store/main';

const g:any = window[ENV.projectName] = window[ENV.projectName] || {};

@Component
export default class RootLoading extends Vue {
  // computed
  protected get isRootLoaded() {
    return mainStore.isRootLoaded
  }
}