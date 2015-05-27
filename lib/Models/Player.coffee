mongoose = require 'mongoose'
Schema = mongoose.Schema


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

module.exports = mongoose.model 'Player', schema
