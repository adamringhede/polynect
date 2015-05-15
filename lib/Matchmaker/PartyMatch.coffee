Request = require('../Models').Request
Delegator = require './Delegator'

# TODO: Create a RolePartyMatch subclass to handle delegations

class PartyMatch
  constructor: (import_data) ->
    if import_data?
      @import import_data
    else
      @requests = []
      @delegator = null
      @map = {}
      @min = 2
      @max = Infinity

  removeRequest = (request) ->
    if @hasRequest request
      @requests.splice(@requests.indexOf(request), 1)
      if @delegator?
        @delegator.remove request

  getSummary: ->
    summary = {}
    summary.players = []
    for request in @requests
      summary.players.push request.id
    summary.minimum = @min
    summary.values = @map
    if @delegator?
      summary.roles = @delegator.getSummary()

  broadcast: (type, data) -> request.emit type, data for request in @requests

  isDone: ->
    done = true
    if @requests.length < @min
      done = false
    if @delegator instanceof Delegator and not @delegator.meetsNeed()
      done = false
    return done
  # Notify players belonging to the requests when the events here occur.
  setMap: (map) ->
    @map = map

  addRequest: (request) ->
      @requests.push request
      if request.min? and request.min > @min then @min = request.min
      if request.max? and request.max < @max then @max = request.max
      # TODO Save should be called here after this class has been turned into a model

  addRequests: (requests) ->
    if requests instanceof Array
      @addRequest r for r in requests
  setRequests: (requests) ->
    @requests = []
    @addRequests requests
  setDelegator: (delegator) ->
    if delegator instanceof Delegator
      @delegator = delegator
  getDelegations: ->
    @delegator?.delegations or null
  hasRequest: (request) ->
    return @requests.indexOf(request) >= 0

  # Create an object which can be used to recreate a new PartyMatch instance
  # as well as to be used to LFM requests and inform players connected to game servers about their delegations.
  export: ->
    roles_need: @delegator?.need or null
    requirements_map: @map
    delegations: if @delegator? then @getDelegations else null
    min: @min
    max: @max

  import: (import_data) ->
    if import_data.delegations?
      delegator = new Delegator import_data.roles_need
      delegator.delegations = import_data.delegations
    @min = import_data.min
    @max = import_data.max
    @setMap import_data.requirements_map


module.exports = PartyMatch
