mongoose = require 'mongoose'
Schema = mongoose.Schema

game = new Schema
  name: String
  alias: String
  created: type: Date, default: Date.now
  active: type: Boolean, default: false
  matchmakers: Array
  developer: type: Schema.Types.ObjectId, ref: 'Developer'


module.exports = mongoose.model 'Game', game