randomstring = require 'randomstring'
moment = require 'moment'
crypto = require 'crypto'
ObjectId = require 'objectid'
mongoose = require 'mongoose'
Schema = mongoose.Schema

module.exports = (schema, options) ->
  schema.add
    token: String
    expires: type: Date, default: undefined
    client_id: String
    holder: type: Schema.Types.ObjectId, ref: 'Account'

  schema.pre 'save', (next) ->
    if @expires is undefined
      if @lifetime
        @expires = moment().add(@lifetime.value, @lifetime.unit)
      else
        @expires = moment().add(1, 'month')
    next()
