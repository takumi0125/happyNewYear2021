// isFirefox
export default function(userAgent) {
  return userAgent.toLowerCase().indexOf('firefox') !== -1;
};
