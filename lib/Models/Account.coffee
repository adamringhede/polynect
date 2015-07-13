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

  #### Player ####

  game: ref: 'Game', type: Schema.Types.ObjectId

  currencies: [{
    count: Number,
    name: String,
    _id: Schema.Types.ObjectId
  }]

schema.methods =

schema.statics =
  ERROR_USERNAME_TAKEN: 'username_taken'
  createWithCredentials: (username, password, game, callback) ->
    hash = crypto.createHash('sha1').update(password + SALT).digest('hex')
    
    this.findOne username: username, (err, model) =>
      if model
        callback? @ERROR_USERNAME_TAKEN, null
      else
        p = new this username: username, password: hash, game: game
        p.save (err, model) -> callback? err, model
  findWithCredentials: (username, password, game, callback) ->
    hash = crypto.createHash('sha1').update(password + SALT).digest('hex')
    this.findOne username: username, password: hash, (err, model) ->
      callback? err, model

schema.plugin Plugins.DataStore

module.exports = mongoose.model 'Account', schema
