// isAndroid
export default function(userAgent) {
  return userAgent.toLowerCase().indexOf('android') !== -1;
};
