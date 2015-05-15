mongoose = require 'mongoose'
Schema = mongoose.Schema

dev = new Schema
  firstname: String
  lastname: String
  username: String
  password: String
  token: String
  active: type: Boolean, default: true

module.exports = mongoose.model 'Developer', dev
