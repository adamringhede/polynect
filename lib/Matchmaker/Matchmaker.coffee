Request = require('../Models').Request
Delegator = require './Delegator'
PartyMatch = require './PartyMatch'
Emitter = require('events').EventEmitter


ALLOWED_TIMEOUTS = 20
TIMEOUT_BASE_DURATION = 500 # ms
TIMEOUT_MAX_DURATION = 10000
ALLOW_LFM = true
SLEEP_DURATION = 500


class Matchmaker extends Emitter

  constructor: (@parties = {}) ->
    @requests = {}
    @queue = []
    @requestQueue = []
    @parties = []
    @timed_out_requests = {}
    @running = false

  put: (request, queue = true, first = false) ->
    request.removed = false
    @requests[request._id] = request
    if queue
      if first
        @queue.unshift request
      else
        @queue.push request

  lfm: (partyMatch) ->
    @parties.push partyMatch

  insertAt: (index, request) ->
    request.removed = false
    if position = @queue.indexOf(request) >= 0
      @queue.splice position, 1
    if index < @queue.length
      @queue.splice index, 0, request
    else
      @put request

  getRequest: (id) ->
    return @requests[id]

  getLoad: () ->
    @load

  # Stop taking requests
  suspend: () ->
    @suspending = true
    for request of @requests
      @remove request, true
    for party in @parties
      party.broadcast('removed', {
        reason: 'matchmaker suspending'
        code: 2
      });

  ###
  Remove from matchmaking by removing from queue
  ###
  remove: (request, hard = false) ->
    request.removed = true
    if request.party?
      request.party.removeRequest(request)
    if @queue.indexOf(request) >= 0
      @queue.splice @queue.indexOf(request), 1
    if hard and @requests[request._id]?
      delete @requests[request._id]
      @load--
    if @timed_out_requests[request._id]
      clearTimeout @timed_out_requests[request._id].timeout
      delete @timed_out_requests[request._id]

  start: ->
    return if @running
    @running = true
    @shift =>
      if @queue.length <= 1
        false
      else
        true
    , =>
      return unless @running
      setTimeout =>
        @start() if @running and @queue.length > 1
      , SLEEP_DURATION

  stop: ->
    @running = false

  findMatchingParty: (request, callback) ->
    for party in @parties
      if (map = request.matches party.map) isnt false
        callback?(party, map)
        return party
    return null

  # This function does not guarantee that the other requests match each other.
  findRequestsMatching: (request, includeTarget = false, callback) ->
    required = (request.min or 2)-1
    matchingRequests = []
    matchingWithRoles = no
    if request.roles? and request.roles.length > 0 and request.requiredRoles?
      matchingWithRoles = yes
      delegator = new Delegator request.requiredRoles #SETTINGS.rolesNeededFor(request.min, request.max)
      if delegator.put(request) is no
        #request.error('no acceptable roles in this')
        return false

    for req in @queue
      if request isnt req and request.matches req

        if matchingWithRoles
          if not delegator.put(req)
            continue


        matchingRequests.push req
        if matchingRequests.length >= required
          matchingRequests.push request if includeTarget
          return matchingRequests
    if callback then callback()

  findRequestMatching: (request, callback) ->
    matchingRequests = []
    matchingWithRoles = false
    if request.roles? and request.roles.length > 0 and request.requiredRoles?
      matchingWithRoles = true
      delegator = new Delegator request.requiredRoles
      unless delegator.put(request)
        #request.error('no acceptable roles in this')¨
        callback?(false)
        return false

    for id, req of @requests
      if req.removed then continue
      if request isnt req and matchMap = request.matches req

        if matchingWithRoles
          if not delegator.put(req)
            continue


        matchingRequests.push req
        matchingRequests.push request
        party = new PartyMatch
        party.setMap matchMap
        party.setRequests matchingRequests
        party.setDelegator delegator
        @remove req
        callback?(party)

    callback?(false)
    return false

  findRequestsMatchingPartyMatch: (partyMatch, callback) ->
    roles_enabled = partyMatch.delegator? and partyMatch.delegator instanceof Delegator
    for id, req  of @requests
      if partyMatch.requests.indexOf(req) < 0 and (matchMap = req.matches partyMatch.map)? # Create a new map if this request matches the map
        if roles_enabled
          if partyMatch.delegator.put(req) # If it is possible to delegate a role to this request, update the delegations
            # Add request to party
            partyMatch.addRequest req
            partyMatch.setMap matchMap
            @remove req
            if partyMatch.isDone
              callback?(partyMatch)
              return partyMatch
          else
            continue
        else
          # Add request to party
          partyMatch.addRequest req
          partyMatch.setMap matchMap
          @remove req

          if partyMatch.isDone
            callback?(partyMatch)
            return partyMatch

    # At this point it is not yet fulfilled
    callback?(partyMatch)
    return partyMatch

  ###
  Put a request on a timeout.
  It should be used to avoid endless loops
  ###
  timeoutRequest: (request) ->

    if request.timeouts > ALLOWED_TIMEOUTS
      @remove request
    else
      request.timeouts = 0 unless request.timeouts?
      request.timeouts += 1
      time = request.timeouts * TIMEOUT_BASE_DURATION
      if time > TIMEOUT_MAX_DURATION
        time = TIMEOUT_MAX_DURATION
      @timed_out_requests[request.id] =
        request: request
        timeout: setTimeout =>
            @put request

          , request.timeouts * TIMEOUT_BASE_DURATION # use a constant or configurable setting here


  shift: (until_evaluator, done) ->
    restart = =>
      if until_evaluator? and until_evaluator?()
        @shift(until_evaluator, done)
      else
        done?()
    # Take the first element of the queue and try to satisfy its requirements
    request = @queue.shift()
    @remove request # prevent others from matching with this, it will be put back if needed anyway

    # Try to find a party
    found_party = @findMatchingParty request, (party, map) =>
      party.addRequest request
      party.setMap map
      if party.isDone()
        @parties.splice(@parties.indexOf(party), 1)
        @groupMatchSuccess(party)
        restart()

    if found_party
      request.emit('matched', found_party)
      return

    # Try to form a party with other request
    @findRequestMatching request, (party) =>
      if party is false

        @timeoutRequest request
        restart()
      else if party.isDone()
        party.broadcast 'matched', party
        @groupMatchSuccess(party)
        restart()
      else
        #party.broadcast 'matched', party
        @findRequestsMatchingPartyMatch party, (party) =>
          if party.isDone()

            @groupMatchSuccess(party)
            # restart by calling @start()
            # or better yet, call a callback function with data about the matching so that the function
            # that calls this function can collect statistics.
            # If the start function is unable to perform anything for a few attempts
            # then set stopped to true, and restart when a new request have been received.
          else
            @groupMatchHold(party)
            #
            # As many requests as possible have been added to the party for the time being.
            # Now save this party together with the matchMap and delegator,
            # and new requests can match against this one
            #
          restart()




  groupMatchSuccess: (party) ->
    # Create a room, select server to use and backup list in case the server faults
    # Notify players about the success and possibly their delegations
    party.broadcast 'finished', party
    @emit 'groupMatchSuccess', party

  groupMatchHold: (party) ->
    # A group can only be on hold for a set amount of time (configurable), then it will be disbanded.
    # The requests will then automatically put the players on the back of the queue.
    #
    # Create a matchingData object, store it in redundant DB with an id and
    # send the id to the player clients. If the clients lose their connection to the server, they will
    # together rejoin another matchmaking server and restart the mathing process using their matching key

    # The rejoin part may be the same as just joining/queueing as a group. Considoer how this should
    # be implemented.
    @lfm party
    @emit 'groupPutOnHold', party


module.exports = Matchmaker
