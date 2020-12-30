const g = window[ENV.projectName] = window[ENV.projectName] || {};

// ------------------------------
// unique Class for each case
// ------------------------------
import WebFont from "webfontloader";

import checkDevice from "../_utils/ua/checkDevice";
g.md = checkDevice();

// if(g.md.tablet()) {
//   g.isTablet = true;
//   const _WIDTH = 1200;
//   if(window.innerWidth < _WIDTH) {
//     const initilScale = window.innerWidth / _WIDTH;
//     document.querySelector('meta[name="viewport"]').setAttribute('content', `width=${_WIDTH},initial-scale=${initilScale}`);
//   }
// } else if(g.md.mobile()) {
//   g.isMobile = true;
// } else {
//   g.isDesktop = true;
// }

const html = document.querySelector("html");

import isiOS from "../_utils/ua/isiOS";
import isAndroid from "../_utils/ua/isAndroid";
import isIE11 from "../_utils/ua/isIE11";
import isEdge from "../_utils/ua/isEdge";
import isWindows from "../_utils/ua/isWindows";
import isChrome from "../_utils/ua/isChrome";
import isFirefox from "../_utils/ua/isFirefox";
import isGoogleBot from "../_utils/ua/isGoogleBot";

const ua = navigator && navigator.userAgent;
if (ua) {
  g.isiOS = isiOS(ua);
  g.isAndroid = isAndroid(ua);
  g.isIE11 = isIE11(ua);
  g.isEdge = isEdge(ua);
  g.isWindows = isWindows(ua);
  g.isGoogleBot = isGoogleBot(ua);
  g.isChrome = !g.isEdge && isChrome(ua);
  g.isFirefox = !g.isEdge && isFirefox(ua);

  if (g.isiOS) html.classList.add("is-ios");
  if (g.isAndroid) html.classList.add("is-android");
  if (g.isIE11) html.classList.add("is-ie11");
  if (g.isEdge) html.classList.add("is-edge");
  if (g.isGoogleBot) html.classList.add("is-windows");
  if (g.isFirefox) html.classList.add("is-firefox");
  if (g.isGoogleBot) html.classList.add("is-googlebot");
  if (g.isWindows && g.isChrome) html.classList.add("is-winchrome");
}

// detect webp support
g.isWebpSupported = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') == 0;
console.log(g.isWebpSupported? 'webp supported': 'webp not supported');
if(!g.isWebpSupported) html.classList.add('is-webpNotSupported');

// get params
g.params = {};
location.search
.replace("?", "")
.split("&")
.forEach(str => {
  let key, value;
  [key, value] = str.split("=");
  g.params[key] = value;
});

const webFontLoaderPromise = new Promise((resolve, reject) => {
  console.log("loading fonts...");
  WebFont.load({
    google: {
      families: ["Wendy One"]
    },

    timeout: 5000,

    fontactive: (familyName, fvd) => {
      console.log("fontactive", familyName, fvd);
    },
    fontinactive: (familyName, fvd) => {
      console.error("fontinactive", familyName, fvd);
    },

    active: () => {
      console.log("all fonts loaded");
      // this.store.commit('addLoadingCurrent');
      resolve();
    },

    inactive: () => {
      console.error("font inactive");
      // this.store.commit('addLoadingCurrent');
      resolve("load fonts error");
    }
  });
});

g.loadFontPromise = Promise.all([
  webFontLoaderPromise,
])

