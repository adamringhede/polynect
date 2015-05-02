mongoose = require 'mongoose'
Schema = mongoose.Schema


schema = new Schema
  username: String
  password: String
  token: String

  # A player can belong to multiple rooms at once
  rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }]

schema.methods.speak = ->
  console.log("Hi, my name is #{this.username}")
  return 2

module.exports = mongoose.model 'Player', schema
