mongoose = require 'mongoose'
Schema = mongoose.Schema


schema = new Schema
  username: String
  password: String
  token: String

  # A player can belong to multiple rooms at once
  rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }]

module.exports = mongoose.model 'Player', schema
