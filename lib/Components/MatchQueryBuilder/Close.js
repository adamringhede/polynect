function Close() {
}
/**
 * Returns null if it is unable to build a query from the supplied parameters.
 * @param  {String} path        The index value on the match map
 * @param  {MatchRequirement} requirement A part of a matchmaking configuration
 * @param  {any} value       A number or string provided by a players attributes or provided parameters
 * @return {null|Object}             Used in mongo queries
 */
Close.build = function (path, requirement, value, factor) {
  var q = {},
      distance;
  if (typeof factor !== 'number') factor = 0;
  if (requirement.distance instanceof Array) {
    var start = requirement.distance[0];
    var length = requirement.distance[1] - start;
    distance = start + length * factor;
  } else {
    distance = requirement.distance;
  }
  
  q[path] = {
    $gte: value - distance,
    $lte: value + distance
  }
  return q;
}
module.exports = Close;
