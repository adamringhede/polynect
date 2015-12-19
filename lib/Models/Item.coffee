mongoose = require 'mongoose'
Plugins = require './Plugins'
Schema = mongoose.Schema

schema = new Schema
  name: String

  #character: type: Schema.Types.ObjectId, ref: 'Character'
  #player: type: Schema.Types.ObjectId, ref: 'Player'
  #game: type: Schema.Types.ObjectId, ref: 'Game'
  #item_spec: type: Schema.Types.ObjectId, ref: 'ItemSpec'


  #product_id: String

  #access_level: Number

  data: {}
  attributes: {}

  #stackable: Boolean
  count: Number

schema.plugin Plugins.Redundancy,
  model: 'Item'
  references:
    character:
      model: 'Character'
    player:
      model: 'Account'
      references:
        game:
          model: 'Game'
          references:
            developer:
              model: 'Account'
    item_spec:
      model: 'ItemSpec'
      fields: ['name', 'stackable', 'default_count', 'product_id', 'access_level']

module.exports = mongoose.model 'Item', schema
