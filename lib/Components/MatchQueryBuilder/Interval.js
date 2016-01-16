function Interval() {
}
/**
 * Returns null if it is unable to build a query from the supplied parameters.
 * @param  {String} path        The index value on the match map
 * @param  {MatchRequirement} requirement A part of a matchmaking configuration
 * @param  {any} value       A number or string provided by a players attributes or provided parameters
 * @return {null|Object}             Used in mongo queries
 */
 Interval.build = function (path, requirement, value) {
  var intervals = requirement.intervals;
  var accepted = [];
  for (var i = 0, l = intervals.length; i < l; i++) {
    var interval = intervals[i];
    if (interval instanceof Array) { // is there a better way to verify this?
      if (value >= interval[0]) {
        if ((interval.length > 1 && value <= interval[1]) || value <= interval[0]) {
          accepted.push(interval);
          break;
        }
      }
    } else if (typeof interval == 'number' && interval === value) {
      accepted.push([value, value]);
    }

  }
  if (accepted.length === 0) {
    return null;
  } else {
    return formQuery(path, accepted[0])
  }
}
function formQuery(path, interval) {
  var q = {};
  q[path+'.0'] = interval[0];
  q[path+'.1'] = interval[1];
  return q;
}
Interval.validate = function (requirement) {
  var errors = [];

  var overlapping = [];
  for (var i = 0, l = requirement.intervals.length; i < l; i++) {
    var a = requirement.intervals[i];
    for (var j = 0; j < l; j++) {
      if (i === j) continue;
      var b = requirement.intervals[j];
      if ((b[0] >= a[0] && b[0] <= a[1]) || (b[1] >= a[0] && b[1] <= a[1])) {
        // Found an overlapping interval.
        overlapping.push([a, b])
      }
    }
  }
  if (overlapping.length > 0) {
    errors.push('There are ' + overlapping.length / 2 + ' overlapping intervals in ' + JSON.stringify(requirement.intervals));
  }

  if (errors.length > 0) {
    return errors
  } else {
    return null;
  }
}

module.exports = Interval;
