mongoose = require 'mongoose'
Schema = mongoose.Schema
random = require 'randomstring'
moment = require 'moment'

TOKEN_LIFETIME = 24 * 30 # hours

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

  # A player is tied to a developer
  developer: ref: 'Developer', type: Schema.Types.ObjectId

schema.methods =
  # This is used after the player has been authenticated
  getToken: () ->
    unless this.token?
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

module.exports = mongoose.model 'Player', schema
