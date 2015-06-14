mongoose = require 'mongoose'

exports.connected = false

exports.connection = null

exports.init = (dbURL) ->
  return if exports.connected
  unless dbURL? then dbURL = process.MONGODB_URL
  mongoose.connect dbURL
  exports.connection = mongoose.connection
  exports.connected = true
