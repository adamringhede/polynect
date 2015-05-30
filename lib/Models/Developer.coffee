mongoose = require 'mongoose'
Schema = mongoose.Schema

SALT = 'do2doh!aALDDSONAnsv783nf4w9fphi9f4pwpj4hb2o'

schema = new Schema
  # User
  firstname: String
  lastname: String

  # Credentials
  username: String
  password: String

  # Authentication
  token: String
  token_expires: Date

schema.methods =
  # This is used after the player has been authenticated
  getToken: () ->
    if !this.token? or !this.verifyWithToken(this.token)
      this.createToken()
      this.save()
    return this.token

  # This will replace the existing token, so it should not be replaced unless it is first removed
  createToken: () ->
    this.token = random.generate(30)
    this.token_expires = moment().add(TOKEN_LIFETIME, 'hours');

  removeToken: () ->
    this.token = undefined
    this.token_expires = undefined

  verifyWithToken: (token) ->
    return false unless this.token? and this.token_expires instanceof Date
    return true if Date.now() <= this.token_expires.getTime() and token is this.token
    return false

schema.statics =
  createWithCredentials: (username, password, callback) ->
    hash = crypto.createHash('sha1').update(password + SALT).digest('hex')
    # Include developer id here
    this.findOne username: username, (err, model) =>
      if model
        callback? 'username taken', null
      else
        p = new this username: username, password: hash
        p.save (err, model) -> callback? err, model
  findWithCredentials: (username, password, callback) ->
    hash = crypto.createHash('sha1').update(password + SALT).digest('hex')
    # Include developer id here
    this.findOne username: username, password: hash, (err, model) ->
      callback? err, model

module.exports = mongoose.model 'Developer', schema
