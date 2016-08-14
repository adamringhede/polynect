mongoose = require 'mongoose'
Models = require './'
Plugins = require './Plugins'
async = require 'async'
Schema = mongoose.Schema

schema = new Schema
  teams: type: [String] # set of all matches
  max_teams: type: Number, default: 1
  size: 0
  attributes: {} # derived from matches

  # Separate this into a plugin called Reservable
  reserved: type: Boolean, default: false
  reserved_at: type: Number, default: -1

schema.statics =
  findForMatch: (match, callback) -> new Promise (resolve, reject) =>
    query =
      "game_id": match.game.id
      "size": {"$lt": match.max_teams}
      "teams": {"$ne": match._id.toString()} # not sure about strings or objectId
    for name, value of match.attributes
      unless query.attributes then query.attributes = {}
      # need to use match query for handle "close" attributes
      query.attributes[name] = value
    mongoose.model('TeamsMatch').findOneAndUpdate query,
      "$inc": {"size": 1},
      "$addToSet": {"teams": match._id.toString()}
    , {'new': true}, (err, teamsMatch) =>
      unless err?
        resolve(teamsMatch)
      else
        console.log err
        throw err

schema.methods =
  isFull: -> @size is @max_teams
  push: (match) ->
    @teams.push match._id
    @size = @teams.length

  release: -> new Promise (resolve, reject) =>
    update = {'$set':{}}
    update['$set']['reserved'] = false;
    update['$set']['reserved_at'] = -1;
    mongoose.model('TeamsMatch').findByIdAndUpdate(@_id, update, resolve)

  reserve: (duration) -> new Promise (resolve, reject) =>
    if duration > 0
      update = {'$set':{}}
      update['$set']['reserved'] = true
      update['$set']['reserved_at'] = Date.now()
      mongoose.model('TeamsMatch').findOneAndUpdate({
        _id: @_id,
        reserved_at: {'$lt': Date.now() - duration}
      }, update, (err, match) =>
        if err then reject(err)
        @reserved = match?
        resolve(match?)
      )
    else resolve(true)

  # Finding teams is difficult as other teams may find this match.
  # This might not be needed though, as newly formed teams will find this teams match
  # However, in case there are other teams out there that was unable to find any match, we
  # need to reserve this match. The only case this would be is if there is low activity,
  # so locking is not really damaging.
  # However, we only attempt to lock it. If it is already locked, we just give up.
  matchWithOthers: -> new Promise (resolve, reject) =>
    if @size is @max_teams then resolve()
    unless @reserved then throw new Error("Can not find teams for a match that is not reserved");
    attempts = @max_teams - @size
    async.whilst(
      => attempts > 0
      (callback) =>
        mongoose.model('Match').findOneAndUpdate({
          game_id: @game_id,
          reserved_at: {'$lt': Date.now() - 50}
          _id: '$nin': @teams  #.map (id) => ObjectId(id)
        }, {
          '$set':
            teams_match: @_id.toString()
          '$push':
            teams: '$each': @teams #.map (id) => id.toString()
        }, {'new': true}, (err, match) =>
          if err then throw err
          attempts--;
          if match?
            @push match
            # TODO update all matches with the list of teams.
            mongoose.model('Match').update({
              teams_match: @_id.toString(),
            }, {
              '$addToSet': teams: '$each': @teams
            }, => callback())
          else
            callback()
        )
      (err, n) =>
        if @size < @max_teams then reject() else resolve()
    )




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
