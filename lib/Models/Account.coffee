crypto = require 'crypto'
Plugins = require './Plugins'
validator = require 'validator'
mongoose = require 'mongoose'
crypto = require 'crypto'
_ = require 'underscore'
Schema = mongoose.Schema

SALT = 'do2doh!aALDDSONAnsv783nf4w9fphi9f4pwpj4hb2o'

validateUniqueCredentials = (username, next) ->
  return true unless username?
  query = username: username, _id: $ne: @_id
  if @role is 'player'
    query.game.id = @game.id
  else
    query.role = @role
  mongoose.model('Account').findOne(query, '_id', (err, model) ->
    if err then throw err
    next(model is null)
  );

validateUniqueProviderId = (uid, next) ->
  return true unless uid?
  query =
    provider:
      uid: uid
      alias: @provider.alias
  if @role is 'player'
    query.game = @game
  else
    query.role = @role
  mongoose.model('Account').findOne(query, '_id', (err, model) ->
    if err then throw err
    next(not model?)
  );

schema = new Schema

  role: type: String, enum: ['developer', 'player', 'admin'], default: 'developer'

  # Credentials
  username: type: String
  password_hash: String

  provider:
    alias: String # Alias of provider, eg. facebook, twitter
    uid: type: String#, validate: [validateUniqueProviderId, 'Not unique'] # The user id retrieved from the provider

  #### Developer ####

  firstname: String
  lastname: String
  email: type: String, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,10})+$/, 'Invalid email']
  accepted_terms: type: String, default: false
  activation_token: type: String
  activated: type: Boolean, default: false # Activated through email
  verified: type: Boolean, default: false # A credit card has been verified

  #### Player ####
  player_id: String # And ID used for matchmaking

  #game: ref: 'Game', type: Schema.Types.ObjectId
  #

schema.path('username').validate (username, callback) ->
  return true unless username?
  query = username: username, _id: $ne: @_id
  if @role is 'player'
    query.game_id = @game_id
  query.role = @role
  mongoose.model('Account').findOne(query, '_id', (err, model) ->
    if err then throw err
    callback(model is null)
  );
, 'Not unique'

schema.methods =
  createActivationToken: ->
    unless @activation_token?
      @activation_token = crypto.createHash('sha1').update(@_id + Math.random()*10000).digest('hex');
  getActivationLink: ->
    unless @activation_token?
      @createActivationToken()
      @save()
    "https://developer.polynect.io/#/activate/#{@activation_token}"
  setId: (id) ->
    @_id = id
  hasAccessToGame: (gameId, callback) ->
    if @role is 'developer'
      #return game.developer._id is @_id or @organisations.indexOf(game.developer._id)
      mongoose.model('Game').findOne _id: gameId, (err, game) =>
        callback? game.holder.toString() is @_id.toString()

  addItem: (itemSpec, count, callback) ->
    if callback?
    then @_addItem itemSpec, this._id, null, count, callback
    else @_addItem itemSpec, this._id, null, null, count

schema.statics =
  hashPassword: (password) ->
    return crypto.createHash('sha1').update(password + SALT).digest('hex');
  findWithCredentials: (input, callback) ->
    hash = this.hashPassword(input.password)
    query = username: input.username, password_hash: hash
    if input.game_id?
      query.game_id = input.game_id
      query.role = 'player'
    else
      query.role = $ne: 'player'
    this.findOne query, (err, model) ->
      callback? err, model

schema.plugin Plugins.LastMod
schema.plugin Plugins.DataStore
schema.plugin Plugins.ItemHolder
schema.plugin Plugins.Redundancy,
  model: 'Account'
  references:
    game:
      model: 'Game'
      fields: ['name']
      references:
        developer:
          model: 'Account'
          fields: ['firstname']


schema.pre 'validate', (next) ->
  if @password
    @password_hash = mongoose.model('Account').hashPassword(@password)
  next()

module.exports = mongoose.model 'Account', schema
