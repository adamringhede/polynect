mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'

AccessToken = new Schema

AccessToken.plugin Plugins.Token

module.exports = mongoose.model 'AccessToken', AccessToken
