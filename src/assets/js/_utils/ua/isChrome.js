// isChrome
export default function(userAgent) {
  return userAgent.toLowerCase().indexOf('chrome') !== -1;
};
