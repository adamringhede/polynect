mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'


Character = new Schema

  name: String

  player: type: Schema.Types.ObjectId, ref: 'Account'

  game: type: Schema.Types.ObjectId, ref: 'Game'


#Character.statics =

#Character.methods = 

Character.plugin Plugins.DataStore

module.exports = mongoose.model 'Character', Character
