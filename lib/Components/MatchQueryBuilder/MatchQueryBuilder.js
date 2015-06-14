var OPath = require('object-path');
var _ = require('underscore');

function MatchQueryBuilder (config, values, player, character, pathPrefix) {
  this.errors = [];
  this.config = config;
  this.values = OPath(values || {});
  this.player = player;
  this.playerData = OPath(player || {});
  this.character = character;
  this.characterData = OPath(character || {});
  this.pathPrefix = pathPrefix ? pathPrefix + '.' : '';
  this.request = this.createRequest();
  this.attempt = 1;
  this.attempts = config.attempts;
}
var builders = {
  same: require('./Same'),
  interval: require('./Interval'),
  close: require('./Close')
}
/**
 * Uses a player, character, defaults and provided values to build a complete mongo query
 * according to a configuration. Queries should be added to the $and query by most restrictive
 * to least restricive for faster processing.
 * @param attempt Number the number of the attempt used to select a value to match on within specified intervals
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

  // Makes sure that the player is not already in the match.
  // It is a low probability that it is in the match so we check
  // this last.
  AND.push({
    requests: {
      $not: {
        $elemMatch: {
          "player.id": this.player._id.toString()
        }
      }
    }
  })

  // TODO Get roles
  return {
    $and: AND
  };
}
MatchQueryBuilder.prototype.hasErrors = function () {
  return this.errors.length > 0;
}
MatchQueryBuilder.prototype.getErrors = function () {
  return _.uniq(this.errors)
}
MatchQueryBuilder.prototype.setAttempt = function(attempt) {
  if (attempt >= 1 && attempt <= this.attempts) {
    this.attempt = attempt;
  } else {
    throw "Invalid attempt: " + attempt
  }
}
MatchQueryBuilder.prototype.getGeneralQuery = function () {
  return {
    size: {
      $gte: this.request.min,
      $lte: this.request.max
    },
    open: true
  }
};
MatchQueryBuilder.prototype.getAttributeQueries = function() {
  var queries = [];
  var factor = (this.attempt-1) / (this.attempts - 1);
  for (var attribute in this.config.attributes) {
    var requirement = this.config.attributes[attribute];
    var value = this.getValue(requirement);
    if (!builders[requirement.type]) {
      this.errors.push('"' + requirement.type + '" is not a valid requirement type');
      continue;
    }
    var query = builders[requirement.type].build(this.pathPrefix + attribute, requirement, value, factor);
    queries.push(query);
  }
  return queries;
}
MatchQueryBuilder.prototype.isValid = function() {
  return this.errors.length === 0;
}
MatchQueryBuilder.prototype.createRequest = function() {
  var request = {
    player: {
      id: this.player._id
    },
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
      model = this.playerData
    } else if (target === 'character') {
      model = this.characterData;
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
      this.errors.push("Unable to retrieve data for requirement: " +
        JSON.stringify(requirement) + " with " + target + " data: " + JSON.stringify(model.get("")));
    }
    return null;
  }
}



module.exports = MatchQueryBuilder;
