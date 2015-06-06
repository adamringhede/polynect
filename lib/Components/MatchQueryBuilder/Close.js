function Close() {
}
/**
 * Returns null if it is unable to build a query from the supplied parameters.
 * @param  {String} path        The index value on the match map
 * @param  {MatchRequirement} requirement A part of a matchmaking configuration
 * @param  {any} value       A number or string provided by a players attributes or provided parameters
 * @return {null|Object}             Used in mongo queries
 */
Close.build = function (path, requirement, value) {
  var q = {};
  q[path] = {
    $gte: value - requirement.distance,
    $lte: value + requirement.distance
  }
  return q;
}
module.exports = Close;
