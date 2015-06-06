mongoose = require 'mongoose'
Builder = require '../Components/MatchQueryBuilder/MatchQueryBuilder'
Schema = mongoose.Schema

###

When adding or removing a request to a match, some attributes may be recalculated.
For instance, a requirement of type close will be set to the average (mean)
of all requests' values.

A request includes references to the player, character and values for matching.

###

schema = new Schema
  requests: [{
      player: type: Schema.Types.ObjectId, ref: 'Player'
      attributes: {},
      roles: [String],
      min: Number,
      max: Number
  }]
  size: type: Number, default: 0
  roles:
    need: {}
    delegations: {}

schema.methods =
  addRequest: (request) ->
    this.size += 1;
    this.requests.push(request)
  removeRequest: (request) ->
    this.size -= 1;

schema.statics =
  findWithRequirements: (config, player, character, input) ->
    builder = new Builder(config, input, player, character);
    # TODO validate
    query = builder.build()
    query.requests = {
      $elemMatch: {
        player: $ne: request.getPlayerId()
      }
    }
    this.findOne query, () ->



module.exports = mongoose.model 'Match', schema
