function Same() {
}
/**
 * Returns null if it is unable to build a query from the supplied parameters.
 * @param  {String} path        The index value on the match map
 * @param  {MatchRequirement} requirement A part of a matchmaking configuration
 * @param  {any} value       A number or string provided by a players attributes or provided parameters
 * @return {null|Object}             Used in mongo queries
 */
Same.build = function (path, requirement, value) {
  // The value can either come from a player, a character, a default value or one provided by a client.
  //
  var q = {};
  q[path] = value;
  return q;
}
module.exports = Same;
