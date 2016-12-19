mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'


schema = new Schema
  name: String
  character_id: String

schema.methods =
  addItem: (itemSpec, count, callback) ->
    if callback?
    then @_addItem itemSpec, this.player.id, this._id, count, callback
    else @_addItem itemSpec, this.player.id, this._id, null, count

schema.plugin Plugins.DataStore
schema.plugin Plugins.ItemHolder

schema.plugin Plugins.Redundancy,
  model: 'Character'
  references:
    player:
      model: 'Account'
      references:
        game:
          model: 'Game'
          references:
            developer:
              model: 'Account'

module.exports = mongoose.model 'Character', schema
