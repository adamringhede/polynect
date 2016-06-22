class Delegator extends require('events')
  constructor: (@need = {}) -> 
    @reset();

  getSummary: ->
    summary = {}
    for name, role of @delegations
      ids = []
      for request in role
        ids.push request.id
      summary[name] = ids

  remove: (request) ->
    for role of @delegations
      role.splice(role.indexOf(request), 1)


  reset: ->
    @delegations = {} 
    for role of @need
      @delegations[role] = []

  meetsNeed: ->
    for role, need of @need
      if need.minimum > @delegations[role].length
        return false
    return true

  put: (request, allow_switching = true) -> 
    if @meetsNeed()
      x = "maximum"
    else 
      x = "minimum"
    for role in request.roles
      if @need[role]? and @need[role][x] > @delegations[role].length 
        @delegations[role].push request
        return true

    return false if not allow_switching

    for role in request.roles
      if @need[role].minimum > 0 # there is a need for this role to begin with but it is occupied
        for other, i in @delegations[role] # find another request with the same role which can fulfill another role
          if other.roles.length > 1 # it may fulfill more roles than the one it is currently assigned
            # TODO: make this function recursive to make multiple switches a possibility
            for otherRole in other.roles
              continue if otherRole is role # we have already determined that there are no spots for this role
              if @need[otherRole]? and @need[otherRole].maximum > @delegations[otherRole].length
                @delegations[otherRole].push other
                @delegations[role].splice i, 1
                @delegations[role].push request
                return true
    return false


module.exports = Delegator