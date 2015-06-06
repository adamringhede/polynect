var OPath = require('object-path');

function MatchQueryBuilder (config, values, player, character, pathPrefix) {
  this.errors = [];
  this.config = config;
  this.values = OPath(values || {});
  this.player = OPath(player || {});
  this.character = OPath(character || {});
  this.pathPrefix = pathPrefix ? pathPrefix + '.' : '';
  this.request = this.createRequest();
}
var builders = {
  same: require('./Same'),
  interval: require('./Interval'),
  close: require('./Close')
}
/**
 * Uses a player, character, defaults and provided values to build a complete mongo query
 * according to a configuration
 */
MatchQueryBuilder.prototype.build = function () {
  var AND = [];
  // Get general
  AND.push(this.getGeneralQuery());
  //
  // Get attributes
  if(this.config.attributes) {
    AND = AND.concat(this.getAttributeQueries());
  }
  // TODO Get roles
  return JSON.stringify({
    $and: AND
  })
}
MatchQueryBuilder.prototype.getGeneralQuery = function () {
  return {
    requests: {
      $size: {
        $gte: this.request.min,
        $lte: this.request.max
      }
    }
  }
};
MatchQueryBuilder.prototype.getAttributeQueries = function() {
  var queries = [];
  for (var attribute in this.config.attributes) {
    var requirement = this.config.attributes[attribute];
    var value = this.getValue(requirement);
    if (!builders[requirement.type]) {
      this.errors.push('"' + requirement.type + '" is not a valid requirement type');
      continue;
    }
    var query = builders[requirement.type].build(this.pathPrefix + attribute, requirement, value);
    queries.push(query);
  }
  return queries;
}
MatchQueryBuilder.prototype.isValid = function() {
  return this.errors.length === 0;
}
MatchQueryBuilder.prototype.createRequest = function() {
  var request = {
    attributes: {},
    roles: null,
    min: 0,
    max: this.config.general.max
  };

  // Set attributes
  for (var attribute in this.config.attributes) {
    request.attributes[attribute] = this.getValue(this.config.attributes[attribute]);
  }

  // Set general
  if (typeof this.values.min == 'number') request.min = this.values.min;
  if (typeof this.values.max == 'number') request.max = this.values.max;

  return request;
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
