mongoose = require 'mongoose'
Schema = mongoose.Schema


Client = new Schema

  # The holder of the client can either be a developer, organisation or admin
  holder: type: Schema.Types.ObjectId

  secret: String
  client_id: type: String, index: true

  name: String

  grants: type: [String], default: ['password']

  redirect_uri: String

Client.pre 'save', (next) ->
  @client_id = @_id.toString()
  next()


module.exports = mongoose.model 'Client', Client, 'clients'
