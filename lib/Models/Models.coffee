mongoose = require 'mongoose'

x =
  connected: false
  init: (dbURL) ->
    return if x.connected
    mongoose.connect dbURL
    x.connected = true

module.exports = x
