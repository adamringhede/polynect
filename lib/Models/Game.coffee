mongoose = require 'mongoose'
Schema = mongoose.Schema

game = new Schema
  name: String
  alias: String
  created: type: Date, default: Date.now()
  matchmaking_config: {}
  holder: type: Schema.Types.ObjectId, ref: 'Account'


module.exports = mongoose.model 'Game', game
