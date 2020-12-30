import Vue from 'vue'
import Vuex from 'vuex'

import { mainStore, MainState } from './main'

Vue.use(Vuex);

export type RootState = {
  app: MainState
}

export default new Vuex.Store<RootState>({})