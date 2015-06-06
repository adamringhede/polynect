var OPath = require('object-path');

function MatchQueryBuilder (config, values, player, character) {
  this.errors = [];
  this.config = config;
  this.values = OPath(values || {});
  this.player = OPath(player || {});
  this.character = OPath(character || {});
}
var builders = {
  same: require('./Same'),
  interval: require('./Interval')
}
/**
 * Uses a player, character, defaults and provided values to build a complete mongo query
 * according to a configuration
 */
MatchQueryBuilder.prototype.build = function () {
  var AND = [];
  // TODO Get general (min, max, etc)
  // Get attributes
  if(config.attributes) {
    AND.concat(this.getAttributeQueries());
  }

  // TODO Get roles
}
MatchQueryBuilder.prototype.getAttributeQueries = function() {
  var queries = [];
  for (var attribute in config.attributes) {
    var requirement = config.attributes[attribute];
    var value = this.getValue(requirement);
    if (!builders[requirement.type]) {
      this.errors.push('[' + requirement.type + '] is not a valid requirement type');
      continue;
    }
    var query = builders[requirement.type].build(attribute, requirement, value);
    queries.push(query);
  }
  return queries;
}
MatchQueryBuilder.prototype.isValid = function() {
  return this.errors.length === 0;
}

MatchQueryBuilder.prototype.getValue = function(requirement) {
  if (typeof requirement.value === 'string') {
    var parts = requirement.value.split('.');
    if (parts.length < 2) {
      this.errors.push("Invalid value selector: " + requirement.value);
    }
    var target = parts.shift().toLowerCase();
    var path = parts.join('.')
    var model;
    if (target === 'player') {
      model = this.player
    } else if (target === 'character') {
      model = this.character;
    } else if (target === 'input') {
      model = this.values;
    }
    if (model.has(path)) { // Use paths here instead
      return model.get(path);
    } else if (requirement.required === true) {
      this.errors.push("No value was provided from requirement: " + JSON.stringify(requirement))
    } else if (requirement.default != null && requirement.default != undefined) {
      return requirement.default;
    } else {
      this.errors.push("Unable to retrieve data from requirement: " +
        JSON.stringify(requirement) + " with input: " + JSON.stringify(this.values));
    }
    return null;
  }
}



module.exports = MatchQueryBuilder;
