mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'


Character = new Schema

  name: String

  player: type: Schema.Types.ObjectId, ref: 'Account'

  game: type: Schema.Types.ObjectId, ref: 'Game'


#Character.statics =

Character.methods =
  addItem: (itemSpec, count, callback) ->
    if callback?
    then @_addItem itemSpec, this.player, this._id, count, callback
    else @_addItem itemSpec, this.player, this._id, null, count

Character.plugin Plugins.DataStore
Character.plugin Plugins.ItemHolder

module.exports = mongoose.model 'Character', Character
