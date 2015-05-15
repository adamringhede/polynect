mongoose = require 'mongoose'

x =
  connected: false
  init: (dbURL) ->
    mongoose.connect dbURL
    x.connected = true

module.exports = x
