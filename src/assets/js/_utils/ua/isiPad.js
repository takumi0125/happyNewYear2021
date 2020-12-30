// isiPad
export default function(userAgent) {
  const ua = navigator.userAgent.toLowerCase();
  return (ua.indexOf('ipad') !== -1) || (ua.indexOf('macintosh') !== -1 && 'ontouchend' in document);
};
