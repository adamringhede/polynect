mongoose = require 'mongoose'
Schema = mongoose.Schema

room = new Schema
  # An ordered list of servers (ip&port) for reconnection in case of faults
  fault_plan: Array 

  # A secret token only players in the room has access to
  token: String 

  created: type: Date, default: Date.now
  open: type: Boolean, default: false
  game: type: Schema.Types.ObjectId, ref: 'Game'


module.exports = mongoose.model 'Room', room