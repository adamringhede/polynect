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

Client.statics =
  BASE_CLIENT_GAMES: 'games'

Client.pre 'save', (next) ->
  unless @client_id then @client_id = @_id.toString()
  next()

Client.path('client_id').validate(function (value, callback) {
  return Timezone.findOne({client_id: value}, "_id" function (err, client) {
    callback(client == null);
  });
}, 'Client_id taken');


module.exports = mongoose.model 'Client', Client, 'clients'
