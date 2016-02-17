mongoose = require 'mongoose'
Builder = require '../Components/MatchQueryBuilder/MatchQueryBuilder'
Plugins = require './Plugins'
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
  #game: type: Schema.Types.ObjectId, ref: 'Game'
  open: type: Boolean, default: true
  status: type: String, default: WAITING
  requirements: {}
  # Matchmaking may use reservation
  reserved: type: Boolean, default: false
  reserved_at: type: Number, default: -1

  size: type: Number, default: 0
  attributes: {}
  rolesEnabled: type: Boolean, default: false
  roles:
    need: {}
    delegations: {}

schema.statics =
  initWithGame: (game) ->
    Match = mongoose.model('Match')
    match = new Match();
    match.game = game._id;
    match.requirements = game.matchmaking_config.attributes;
    if game.matchmaking_config.roles? and game.matchmaking_config.roles.limits?
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
    if config.roles
      if @delegateRequest(request, config.roles.allowSwitching)
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

    this.calculateAttributes();
    return true;

  removeRequest: (request) ->
    this.size -= 1;
    this.calculateAttributes();

  delegateRequest: (request, allowSwitching = false) ->
    `
    var limit = 1;
    for (role in this.roles.need) {
      var need = this.roles.need[role];
      if (need[0] > this.roles.delegations[role].length) {
        limit = 0;
        break;
      }
    }

    for (var i = 0, l = request.roles.length; i < l; i++) {
      var role = request.roles[i];
      if (this.roles.need[role] && this.roles.need[role][limit] > this.roles.delegations[role].length) {
        this.addPlayerToRole(role, {
          id: request.player.id,
          roles: request.roles
        });
        return true;
      }
    }`

    return false unless allowSwitching

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

###
There i no way to try to chagne the collection per request.
If we want to split matches into different collections we need to use the mongo driver directly.   
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
      references:
        developer:
          model: 'Account'

module.exports = mongoose.model 'Match', schema
