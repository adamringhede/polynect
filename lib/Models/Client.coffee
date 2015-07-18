mongoose = require 'mongoose'
Schema = mongoose.Schema
uniqueValidator = require('mongoose-unique-validator');


Client = new Schema

  # The holder of the client can either be a developer, organisation or admin
  holder: type: Schema.Types.ObjectId

  secret: String
  client_id: type: String, index: true, required: true, unique: true

  name: String

  grants: type: [String], default: ['password']

  redirect_uri: String

Client.statics =
  BASE_CLIENT_GAMES: 'games'
  DEV_PORTAL: 'dev_portal'

Client.plugin uniqueValidator

Client.pre 'save', (next) ->
  unless @client_id then @client_id = @_id.toString()
  next()



module.exports = mongoose.model 'Client', Client, 'clients'
