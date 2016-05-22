puid = require('puid')
p = new puid()
_ = require('underscore');

class Request extends require('events')
  constructor: (@requirements = {}) ->
    @id = p.generate()
    @min = 2
    @max = 2
    @created = (new Date).getTime()
    @removed = true
    @game = null
    @setRequirements()


  timeSinceCreated: -> (new Date).getTime() - @created_on

  setRequirements: (requirements = @requirements) ->
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
      if requirement.type is 'close' and requirement.under? and requirement.over?
        requirement.min = requirement.value - requirement.under
        requirement.max = requirement.value + requirement.over


  ###
  Consider breaking this function into smaller ones.
  For instance, each comparison type could be seperate function in a seperate file.
  Such as: SameComparator, CloseComparator, IntervalComparator, ListComparator
  ###
  matches: (target) ->
    # check if min >= min and max <= max  and  min < max
    # Variable group sizes can be a bad idea
    # Instead players will be able to create rooms with their own specifications
    # used to create the PartyMatch object and players who join will not affect the the min and max of the partyMatch.

    if (target.game isnt this.game)
      return false

    map = {}
    for path, requirement of @requirements
      if target instanceof Request
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




module.exports = Request
