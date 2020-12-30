const config = {
  default: {
    siteUrl: 'https://2021.unshift.jp/',

    showOGP: true, // ogpタグを表示するかどうか

    // author: ''
    // copyright: ''

    siteTitle: 'Happy New Year 2021 by unshift',
    useTitleAsOgTitle: true, // ogTitleをtitleと同じにするかどうか
    ogTitle: '',
    useTitleSeparater: true,
    titleSeparater: ' | ',

    keywords: '',

    description: "Wishing you good health and happiness!",
    useDescriptionAsOgDescription: true, // ogDescriptionをdescriptionと同じにするかどうか
    ogDescription: "",

    // fbAppId: ''

    ogSiteName: 'Happy New Year 2021 by unshift',

    ogImage: 'https://2021.unshift.jp/assets/img/ogp.jpg',
    ogImageType: 'image/jpeg',
    ogImageWidth: '1200',
    ogImageHeight: '630',

    ogType: 'website',
    // ogLocale: 'ja_JP',

    showTwitterCard: true, // twitterCardを表示するかどうか
    twitterCardType: 'summary_large_image',
    useOgAsTwitterCard: true, // twitterCardの各値をogの各値と同じにするかどうか
    twitterCardTitle: '',
    twitterCardDesc: '',
    twitterCardImg: '',

    favicons: {
      default: '/assets/img/icon/favicon.ico'
      // "96x96": '/assets/img/icon/favicon-96.png'
      // "192x192": '/assets/img/icon/favicon-192.png'
    },

    appleTouchIcons: {
      default: '/assets/img/icon/apple-touch-icon.png'
      // "57x57"  : '/assets/img/icon/apple-touch-icon-57.png'
      // "60x60"  : '/assets/img/icon/apple-touch-icon-60.png'
      // "72x72"  : '/assets/img/icon/apple-touch-icon-72.png'
      // "76x76"  : '/assets/img/icon/apple-touch-icon-76.png'
      // "114x114": '/assets/img/icon/apple-touch-icon-114.png'
      // "120x120": '/assets/img/icon/apple-touch-icon-120.png'
      // "144x144": '/assets/img/icon/apple-touch-icon-144.png'
      // "152x152": '/assets/img/icon/apple-touch-icon-152.png'
      // "180x180": '/assets/img/icon/apple-touch-icon-180.png'
    },


    manifestJson: '/assets/img/icon/manifest.json',

    themeColor: '#ffffff',

    maskIcon: {
      svg: '',
      color: '#000000'
    },

    msAppTitleColor: '#ffffff'
  },

  production: {
    siteUrl: 'https://2021.unshift.jp/',
    ogImage: 'https://2021.unshift.jp/assets/img/ogp.png'
  }
};

module.exports = (env)=> {
  const data = Object.assign(config.default, config[env] || {});
  data.env = env;
  return data;
};
