mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'
uniqueValidator = require('mongoose-unique-validator');

schema = new Schema
  client_id: type: String, index: true, required: true, unique: true
  secret: String
  name: String
  grants: type: [String], default: ['password']
  redirect_uri: String

schema.statics =
  BASE_CLIENT_GAMES: 'games'
  DEV_PORTAL: 'dev_portal'

schema.plugin uniqueValidator
schema.plugin Plugins.Redundancy,
  model: 'Client'
  references:
    holder:
      model: 'Account'

schema.pre 'save', (next) ->
  ###
  if (this.client_id == null) {
    this.client_id = this._id.toString()
  }
  ###
  unless @client_id then @client_id = @_id.toString()
  next()

module.exports = mongoose.model 'Client', schema, 'clients'
