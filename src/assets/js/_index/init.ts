const g:any = window[ENV.projectName] = window[ENV.projectName] || {};

import polyfillHelper from '../_modules/polyfillHelper';
polyfillHelper();
require('../_modules/head');

import Main from './Main';
new Main();