mongoose = require 'mongoose'
Schema = mongoose.Schema

schema = new Schema
  players: [type: Schema.Types.ObjectId, ref: 'Player']
  requests: [type: Schema.Types.ObjectId, ref: 'Request']
  requirements: {}
  roles:
    need: {}
    delegations: {}

schema.methods =

schema.statics =

module.exports = mongoose.model 'Match', schema
