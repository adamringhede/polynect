mongoose = require 'mongoose'
Builder = require '../Components/MatchQueryBuilder/MatchQueryBuilder'
Plugins = require './Plugins'
ObjectId = require('objectid')
Worker = require('../Worker')
Models = require './'
Schema = mongoose.Schema


WAITING = 'waiting' # Still waiting for additional requests to meet requirements.
                    # A match can still be in this state if using a delay after minimum has
                    # been reached but maximum has not.
READY = 'ready' # Match has met requirements, any delay has expired and it is ready to start


schema = new Schema
  requests: [{
      player: {
        id: String
      },
      character: {
        id: String
      }
      attributes: {},
      roles: [String],
      min: Number,
      max: Number
  }]

  open: type: Boolean, default: true
  status: type: String, default: WAITING, enum: [WAITING, READY]
  requirements: {}
  # Matchmaking may use reservation
  reserved: type: Boolean, default: false
  reserved_at: type: Number, default: -1

  teams: type: [String]
  teams_match: type: String
  max_teams: type: Number, default: 1

  min: type: Number, default: 2
  max: type: Number, default: 64
  size: type: Number, default: 0
  attributes: {}
  rolesEnabled: type: Boolean, default: false
  roles:
    need: {}
    delegations: {}

schema.statics =
  STATUS_READY: READY
  STATUS_WAITING: WAITING
  initWithGame: (game) ->
    Match = mongoose.model('Match')
    match = new Match();
    match.game = game._id;
    match.min = game.matchmaking_config.general.min or match.min
    match.max = game.matchmaking_config.general.max or match.max
    match.requirements = game.matchmaking_config.attributes
    if game.matchmaking_config.teams?
      match.max_teams = game.matchmaking_config.teams.count

    if game.matchmaking_config.roles?.limits?
      match.rolesEnabled = true;
      match.roles.need = {}
      match.roles.delegations = {}
      for role, limit of game.matchmaking_config.roles.limits
        match.roles.delegations[role] = []
        if limit instanceof Array
          if limit.length is 2 and limit[0] <= limit[1]
            match.roles.need[role] = limit
          else if limit.length is 1
            match.roles.need[role] = [limit[0], limit[0]]
          else
            throw "Invalid role limit " + limit
        else if typeof limit is 'number'
          match.roles.need[role] = [limit, limit]
    return match


schema.methods =
  clearReservation: () ->
    @reserved = false
    @reserved_at = -1
  calculateAttributes: `function() {
    if (this.requests.length === 0) return;
    this.attributes = {};
    for (var attribute in this.requirements) {
      var requirement = this.requirements[attribute];
      if (requirement.type === 'same') {
        this.attributes[attribute] = this.requests[0].attributes[attribute];
      } else if (requirement.type === 'close') {
        var sum = 0;
        for (var i = 0, l = this.requests.length; i < l; i++) {
          sum += this.requests[i].attributes[attribute];
        }
        this.attributes[attribute] = sum / this.requests.length;
      } else if (requirement.type === 'interval') {
        var value = this.requests[0].attributes[attribute];
        for (var i = 0, l = requirement.intervals.length; i < l; i++) {
          var interval = requirement.intervals[i];
          if (value >= interval[0] && value <= interval[1]) {
            this.attributes[attribute] = interval;
            break;
          }
        }
      }
    }
  }`
  addRequest: (request, config) ->
    if @rolesEnabled
      if @delegateRequest(request, config.roles.allow_switching)
        this.markModified('roles.delegations')
      else return false

    # Makes sure we don't already have the request
    haveRequest = false
    for other in this.requests
      if other.player.id.toString() is request.player.id.toString()
        haveRequest = true
        break

    this.requests.push(request) unless haveRequest
    this.size = this.requests.length

    this.calculateAttributes()
    this.calculateStatus()

    return !haveRequest

  removePlayer: (playerId) ->
    removed = false
    for request, i in @requests
      if request.player.id == playerId
        @requests.splice(i, 1)
        removed = true
        break

    if @roles?.delegations?
      for role, delegations of @roles.delegations
        for delegate, k in delegations
          if delegate.id == playerId
            delegate.splice(k, 1)
    if removed then @onRemoveRequest()
    removed

  oldreserve: () ->
    update = {'$set':{}}
    update['$set']['reserved'] = true;
    update['$set']['reserved_at'] = Date.now();
    mongoose.model 'Match'
      .findByIdAndUpdate(@_id, update)
    true

  reserve: (duration) -> new Promise (resolve, reject) =>
    if duration > 0
      update = {'$set':{}}
      update['$set']['reserved'] = true
      update['$set']['reserved_at'] = Date.now()
      mongoose.model('Match').findOneAndUpdate({
        _id: @_id,
        reserved_at: {'$lt': Date.now() - duration}
      }, update, (err, match) =>
        if err then reject(err)
        @reserved = match?
        resolve(match?)
      )
    else resolve(true)

  release: -> new Promise (resolve, reject) =>
    update = '$set':
      reserved: false
      reserved_at: -1
    mongoose.model 'Match'
      .findByIdAndUpdate(@_id, update, resolve)

  matchWithTeams: -> new Promise (resolve, reject) =>
    # Find a team to join
    # If that does not work, create a new team, append the match to it and we are done
    # After that, assign the team to a worker that looks for matches to att to it.
    # The reason for assigning it to a worker is incase this process crashes and the teams match is left alone.
    TeamsMatch = require('./TeamsMatch')
    if @size is 1 and not @teams_match?
      # We can only do this if we have reserved the match, or else we may create multiple teams matches.
      # On a second note, if we can prove that the match will never have multiple threads thinking that the size is 1
      # at the same time, then there is no need to reserve it.
      @reserve(50).then (reserved) =>
        unless reserved then return resolve()
        TeamsMatch.findForMatch(this).then (teamsMatch) =>
          reserveTime = 50
          unless teamsMatch?
            teamsMatch = new TeamsMatch()
            teamsMatch.game = @game_id
            teamsMatch.max_teams = @max_teams
            teamsMatch.reserved = true
            teamsMatch.reserved_at = Date.now()
            teamsMatch.push(this)
            teamsMatch.save()
            reserveTime = 0
          else
          # Todo need to prevent matches that already are in a teams match to be included in another match's teams match
          @teams_match = teamsMatch._id
          for id in teamsMatch.teams
            if @teams.indexOf(id.toString()) < 0
              @teams.push id.toString()

          @save()
          if teamsMatch.isFull() then return @release().then(resolve)
          teamsMatch.reserve(reserveTime).then (reserved) =>
            return unless reserved
            teamsMatch.matchWithOthers()
            .then =>
              @release().then(=> teamsMatch.release().then(resolve))
            .catch (err) =>
              # It may not be necessary to let a worker find teams, as a newly created match will find this team atomically.
              #console.log "Could not find enough teams. Delegating task to worker."
              #Worker.run 'matchTeams', teamsMatchId: teamsMatch._id
              # We release it as it may take more time for the worker to start, than for another match to start
              # looking for this teams match.
              @release().then(=> teamsMatch.release().then(resolve))
    else resolve()


  onRemoveRequest: ->
    this.size -= 1;
    this.calculateAttributes();
    this.calculateStatus()

  calculateStatus: ->
    enoughPlayers = this.size >= this.min
    fulfilledRoles = true
    if this.rolesEnabled
      for role, need of this.roles.need
        if need[0] > this.roles.delegations[role]?.length
          fulfilledRoles = false
    allTeams = @max_teams is 1 or @max_teams is @teams?.length
    this.status = if enoughPlayers and fulfilledRoles and allTeams then READY else WAITING

  delegateRequest: (request, allow_switching = false) ->
    # The minSum is the number of spots left that has to be filled 
    # It is used to determine if we can delegate a request to a lower priority
    # role. 
    `
    var limit = 1;
    var minSum = 0;
    for (var role in this.roles.need) {
      var need = this.roles.need[role];
      if (need[0] > this.roles.delegations[role].length) {
        limit = 0;
      }
      minSum += need[0] - this.roles.delegations[role].length;
    }

    for (var i = 0, l = request.roles.length; i < l; i++) {
      var role = request.roles[i];
      if (this.roles.need[role] && (this.roles.need[role][limit] > this.roles.delegations[role].length 
         || this.max - this.size > minSum)) {
        this.addPlayerToRole(role, {
          id: request.player.id,
          roles: request.roles
        });
        return true;
      }
    }`

    return false unless allow_switching

    # This is less restrictive
    for role in request.roles
      if @roles.need[role][0] > 0 # there is a need for this role to begin with but it is occupied
        for other, i in @roles.delegations[role] # find another request with the same role which can fulfill another role
          if other.roles.length > 1 # it may fulfill more roles than the one it is currently assigned
            # TODO: make this function recursive to make multiple switches a possibility
            for otherRole in other.roles
              continue if otherRole is role # we have already determined that there are no spots for this role
              if @roles.need[otherRole]? and @roles.need[otherRole][1] > @roles.delegations[otherRole].length
                @roles.delegations[otherRole].push other
                @addPlayerToRole otherRole, other
                # Remove other player from the role
                @roles.delegations[role].splice i, 1
                # Add the new player to this role
                @addPlayerToRole role, {
                  id: request.player.id,
                  roles: request.roles
                }
                return true
    return false
  addPlayerToRole: (role, player) ->
    alreadyAdded = false
    if !@roles.delegations[role]
      @roles.delegations[role] = []
    else
      for otherPlayer in @roles.delegations[role]
        if otherPlayer.id.toString() == player.id.toString()
          alreadyAdded = true
          break
    unless alreadyAdded
      @roles.delegations[role].push {
        id: player.id,
        roles: player.roles
      }

schema.pre 'save', (next) ->
  # If changin from state waiting to ready for the first time,
  next()

schema.post 'save', ->
  #@matchWithTeams()
###
There is no way to try to chagne the collection per request.
If we want to split matches into different collections we need to use the mongo driver directly and build our own ODM.
schema.pre 'findOneAndUpdate', () ->
  this.mongooseCollection.collection.s.namespace = 'polynect-test.test_matches'
schema.pre 'save', (next) ->
  this.mongooseCollection.collection.s.namespace = 'polynect-test.test_matches'
  next()
###


schema.plugin Plugins.Redundancy,
  model: 'Match',
  references:
    game:
      model: 'Game'
      fields: ['matchmaking_config']
      references:
        developer:
          model: 'Account'

module.exports = mongoose.model 'Match', schema
