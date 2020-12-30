// isEdge
export default function(userAgent) {
  return userAgent.toLowerCase().indexOf('edge') !== -1;
};
