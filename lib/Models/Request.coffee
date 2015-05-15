mongoose = require 'mongoose'
Models = require '../Models'
Schema = mongoose.Schema

request = new Schema
  player: ref: 'Player', type: Schema.Types.ObjectId
  requirements: type: Object
  roles: [String]
  created: type: Date, default: Date.now
  game: type: Schema.Types.ObjectId, ref: 'Game'
  status: type: String, default: 'none'

  # Matchmaking algorithm variables
  reserved: type: Boolean, default: false
  reserved_at: type: Date
  matchmaker:
    host: type: String, default: 'localhost'
    port: type: Number, default: 48001
  min: Number
  max: Number

request.path('status').validate( (value) ->
  return /matched|queued|cancelled|finished|none/i.test(value);
, 'Invalid status');

request.methods =
  setRequirements: (requirements) ->
    if requirements.min? and typeof requirements.min is 'number'
      @min = requirements.min
    @max = if requirements.max? and typeof requirements.max is 'number' then requirements.max else @min
    delete requirements.min
    delete requirements.max

    for path, requirement of requirements
      if requirement.type is 'interval' and requirement.intervals? # intervals should be retrieved from config
        requirement.acceptedIntervals = []
        for interval in requirement.intervals
          if interval[0] <= requirement.value <= interval[1]
            requirement.acceptedIntervals.push interval
      if requirement.type is 'close'
        if requirement.distance?
          requirement.min = requirement.value - requirement.distance
          requirement.max = requirement.value + requirement.distance
        else if requirement.under? and requirement.over?
          requirement.min = requirement.value - requirement.under
          requirement.max = requirement.value + requirement.over
    @requirements = requirements
  matches: (target) ->
    if (target.game isnt this.game)
      return false

    map = {}
    for path, requirement of @requirements
      if target instanceof Models.Request
        if target.requirements[path]?
          value = target.requirements[path].value
        else if requirement.required == true
          return false
        else
          continue;
      else
        value = target[path]

      if requirement.type is 'same'
        if value isnt requirement.value
          return false
        else
          map[path] = value
      else if requirement.type is 'close'
        if not (requirement.min <= value <= requirement.max)
          return false
        else
          map[path] = (requirement.value + value) / 2
      else if requirement.type is 'list'
        intersection = _.intersection(requirement.value, value)
        if intersection.length > 0
          map[path] = intersection
        else
          return false
      else if requirement.type is 'interval'
        return false if requirement.acceptedIntervals.length is 0
        if value instanceof Array
          for interval in requirement.acceptedIntervals
            intervals = []
            for vinterval in value
              if interval[0] <= vinterval[0] <= interval[1] and interval[0] <= vinterval[1] <= interval[1]
                intervals.push interval
        else
          for interval in requirement.acceptedIntervals
            intervals = []
            if (interval[0] <= value <= interval[1])
              intervals.push interval
            else
        return false if intervals.length is 0
        map[path] = intervals
    return map



module.exports = mongoose.model 'Request', request
