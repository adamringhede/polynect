mongoose = require 'mongoose'
Schema = mongoose.Schema

request = new Schema
  player: ref: 'Player', type: Schema.Types.ObjectId
  # A matchmaking server can pick up reserved request if it has been reserved for more than 30 seconds
  # A matchmaking server is forced to release a request at 25 seconds, unless it has found another player
  # at which time it can rereserve the request for another 30 seconds
  reserved_time: Number
  requirements: type: Object
  created: type: Date, default: Date.now
  active: type: Boolean, default: false
  matchmakers: Array
  developer: type: Schema.Types.ObjectId, ref: 'Developer'


module.exports = mongoose.model 'Request', request
