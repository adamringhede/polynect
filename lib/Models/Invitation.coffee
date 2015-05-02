mongoose = require 'mongoose'
Schema = mongoose.Schema

invitation = new Schema
  inviter: type: Schema.Types.ObjectId, ref: 'Player'
  invitee: type: Schema.Types.ObjectId, ref: 'Player'
  room: type: Schema.Types.ObjectId, ref: 'Room'
  created: type: Date, default: Date.now 
  lifetime: type: Number, default: 3 * 60 # seconds
  status: type: Number, default: 0
  withrawn: type: Boolean, default: false
  game: type: Schema.Types.ObjectId, ref: 'Game'

invitation.methods =
  accept: -> @status = 1 unless @withrawn 
  decline: -> @status = -1 unless @withrawn
  withraw: -> @withrawn = true
  isAccepted: -> @status > 0
  isDeclined: -> @status < 0
  isWaiting: -> @status is 0
  isValid: -> Date.now() - @created.getTime() < @lifetime * 1000



module.exports = mongoose.model 'Invitation', invitation