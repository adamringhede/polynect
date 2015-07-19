randomstring = require 'randomstring'
moment = require 'moment'
crypto = require 'crypto'
ObjectId = require 'objectid'
mongoose = require 'mongoose'
Schema = mongoose.Schema

module.exports = (schema, options) ->
  schema.add
    token: String
    expires: Date
    client_id: String
    holder: type: Schema.Types.ObjectId, ref: 'Account'

  schema.pre 'save', (next) ->
    if @expires === undefined
      expires = moment().add(1 , 'month')
    next()


  schema.statics.create = (lifetime = null) ->
    str = randomstring.generate(40)
    console.log(str);
    random = Math.floor(Math.random() * 100001);
    timestamp = (new Date()).getTime();
    sha256 = crypto.createHmac("sha256", random + "WOO" + timestamp);

    token = sha256.update(str).digest("base64");

    if lifetime?
      expires = moment().add(lifetime , 'seconds')
    else
      expires = null

    return new @({
      token: token,
      expires: expires
    })
