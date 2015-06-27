random = require 'randomstring'
moment = require 'moment'
crypto = require 'crypto'
OPath = require 'object-path'
mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'


TOKEN_LIFETIME = 24 * 30 # hours
SALT = '!NPnp9apdufnyfb3twbi73hd0wjwh2ueno'

schema = new Schema
  provider:
    alias: String # Alias of provider, eg. facebook, twitter
    uid: String # The user id retrieved from the provider

  # Credentials for basic authentication
  username: String
  password: String

  # A player has only one token at one time until it expires.
  token: String
  token_expires: Date

  # A player is tied to a game
  game: ref: 'Game', type: Schema.Types.ObjectId

  # Misc
  created: type: Date, default: Date.now()


schema.methods =
  # This is used after the player has been authenticated
  getToken: () ->
    if !this.token? or !this.verifyWithToken(this.token)
      this.createToken()
      this.save()
    return this.token

  # This will replace the existing token, so it should not be replaced unless it is first removed
  createToken: () ->
    this.token = random.generate(30)
    this.token_expires = moment().add(TOKEN_LIFETIME, 'hours');

  removeToken: () ->
    this.token = undefined
    this.token_expires = undefined

  verifyWithToken: (token) ->
    return false unless this.token? and this.token_expires instanceof Date
    return true if Date.now() <= this.token_expires.getTime() and token is this.token
    return false
  tokenIsValid: (token) ->
    this.token? and Date.now() <= this.token_expires.getTime() and token is this.token

schema.statics =
  ERROR_USERNAME_TAKEN: 'username is already taken'
  ERROR_TOKEN_INVALID: 'token_invalid'
  createWithCredentials: (username, password, game, callback) ->
    hash = crypto.createHash('sha1').update(password + SALT).digest('hex')
    # Include developer id here
    this.findOne username: username, game: game, (err, model) =>
      if model
        callback? 'username taken', null
      else
        p = new this username: username, password: hash, game: game
        p.createToken();
        p.save (err, model) -> callback? err, model
  findWithCredentials: (username, password, game, callback) ->
    hash = crypto.createHash('sha1').update(password + SALT).digest('hex')
    # Include developer id here
    this.findOne username: username, password: hash, game: game, (err, model) ->
      callback? err, model
  findWithToken: (token, callback) ->
    this.findOne token: token, (err, model) =>
      if model?
        if (model.tokenIsValid(token))
          callback? null, model
        else
          console.log this.ERROR_TOKEN_INVALID
          callback?(this.ERROR_TOKEN_INVALID, model)
      else
        callback? null, null


schema.plugin Plugins.DataStore


module.exports = mongoose.model 'Player', schema
