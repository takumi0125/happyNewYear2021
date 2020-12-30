// isGoogleBot
export default function(userAgent) {
  return userAgent.toLowerCase().indexOf('googlebot') >= 0;
}
