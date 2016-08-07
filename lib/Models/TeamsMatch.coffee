mongoose = require 'mongoose'
Plugins = require './Plugins'
Schema = mongoose.Schema

schema = new Schema
  teams: type: Array # set of all matches
  max_teams: type: Number, default: 1
  size: 0
  attributes: {} # derived from matches

schema.statics =
  findForMatch: (match, callback) ->
    query =
      #"game_id": match.game.id
      "size": {"$lt": match.max_teams}
      "teams": {"$ne": match._id} # not sure about strings or objectId
    for name, value of match.attributes
      query[name] = value
    mongoose.model('TeamsMatch').findOneAndUpdate query,
      "$inc": {"size": 1},
      "$addToSet": {"teams": match._id}
    , callback

schema.methods =
  push: (match) ->
    @teams.push match._id
    @size = @teams.length
  matchWithOthers: ->
    attempts = @maxTeams - @size + 3
    while attempts > 0 and @size < @max_teams
      console.log()


schema.plugin Plugins.Redundancy,
  model: 'TeamsMatch',
  references:
    game:
      model: 'Game'
      fields: ['matchmaking_config']
      references:
        developer:
          model: 'Account'

module.exports = mongoose.model 'TeamsMatch', schema
