mongoose = require 'mongoose'
Schema = mongoose.Schema

room = new Schema
  token: String
  created: type: Date, default: Date.now
  open: type: Boolean, default: false
  game: type: Schema.Types.ObjectId, ref: 'Game'


module.exports = mongoose.model 'Room', room
