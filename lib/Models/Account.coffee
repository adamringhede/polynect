crypto = require 'crypto'
Plugins = require './Plugins'
validator = require 'validator'
mongoose = require 'mongoose'
Schema = mongoose.Schema

SALT = 'do2doh!aALDDSONAnsv783nf4w9fphi9f4pwpj4hb2o'

validateUniqueCredentials = (username, next) ->
  return true unless username?
  query = username: username
  if @role is 'player'
    query.game = @game
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
  username: type: String, validate: [validateUniqueCredentials, 'Not unique']
  password_hash: String

  provider:
    alias: String # Alias of provider, eg. facebook, twitter
    uid: type: String#, validate: [validateUniqueProviderId, 'Not unique'] # The user id retrieved from the provider

  #### Developer ####

  firstname: String
  lastname: String
  email: type: String, validate: [validator.isEmail, 'Invalid email']

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
  hashPassword: (password) ->
    return crypto.createHash('sha1').update(password + SALT).digest('hex');
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
    hash = this.hashPassword(input.password)
    this.findOne username: input.username, password_hash: hash, (err, model) ->
      callback? err, model

schema.plugin Plugins.DataStore

schema.pre 'save', (next) ->
  if @password
    @password_hash = mongoose.model('Account').hashPassword(@password)
  next()

#schema.index({ username: 1, game: 1 }, { unique: true, sparse: true })
#schema.index({ 'provider.uid': 1, 'provider.alias', game: 1 }, { unique: true, sparse: true })
#schema.index({ username: 1, role: 1 }, { unique: true, sparse: true })

module.exports = mongoose.model 'Account', schema
