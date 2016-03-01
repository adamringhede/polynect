mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'
validator = require 'validator'
crypto = require 'crypto'
ObjectId = require 'objectid'


schema = new Schema
  email: type: String, validate: [validator.isEmail, 'Invalid email']
  token: type: String, index: true, unique: true

schema.pre 'validate', (next) ->
  mongoose.model('Account').findOne({email: @email}, '_id', (err, model) =>
    if err then throw err
    if model? and not @account?
      @account = model._id
    next()
  );

schema.path('email').validate (email) ->
  return @account? and @account.id?
, 'Could not be found'


schema.pre 'save', (next) ->
  if @token? then next()
  crypto.randomBytes 256, (ex, buffer) =>
    if (ex) then return next(new Error('Could not generate token'));

    @token = crypto
      .createHash('sha256')
      .update(buffer + ObjectId().toString() + @email)
      .digest('hex');

    next()

schema.methods =
  getLink: () -> "https://developer.polynect.io/#/reset-password/#{@token}"

schema.plugin Plugins.Redundancy,
  model: 'PasswordResetToken'
  references:
    account:
      model: 'Account'
      fields: ['firstname', 'lastname', 'username']


module.exports = mongoose.model 'PasswordResetToken', schema
