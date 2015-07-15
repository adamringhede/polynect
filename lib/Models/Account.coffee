crypto = require 'crypto'
Plugins = require './Plugins'
mongoose = require 'mongoose'
Schema = mongoose.Schema

SALT = 'do2doh!aALDDSONAnsv783nf4w9fphi9f4pwpj4hb2o'

schema = new Schema

  role: type: String, enum: ['developer', 'player', 'admin']

  # Credentials
  username: String
  password: String

  provider:
    alias: String # Alias of provider, eg. facebook, twitter
    uid: String # The user id retrieved from the provider

  #### Developer ####

  firstname: String
  lastname: String
  email: String

  #### Player ####

  game: ref: 'Game', type: Schema.Types.ObjectId

  currencies: [{
    count: Number,
    name: String,
    _id: Schema.Types.ObjectId
  }]

schema.methods =

schema.statics =
  ERROR_USERNAME_TAKEN: 'Username taken'
  createWithCredentials: (input, callback) ->
    hash = crypto.createHash('sha1').update(input.password + SALT).digest('hex')
    unless input.role? then input.role = 'developer'

    query = username: input.username
    if input.role? then query.role = input.role
    if input.game? then query.game = input.game
    this.findOne query, (err, model) =>
      if model
        callback? @ERROR_USERNAME_TAKEN, null
      else
        if input.game?
          p = new this username: input.username, password: hash, game: input.game, role: 'player'
        else
          p = new this username: input.username, password: hash, role: input.role
        p.save (err, model) -> callback? err, model
  findWithCredentials: (input, callback) ->
    hash = crypto.createHash('sha1').update(input.password + SALT).digest('hex')
    this.findOne username: input.username, password: hash, (err, model) ->
      callback? err, model

schema.plugin Plugins.DataStore

module.exports = mongoose.model 'Account', schema
