mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'

RefreshToken = new Schema

RefreshToken.plugin Plugins.Token

module.exports = mongoose.model 'RefreshToken', RefreshToken
