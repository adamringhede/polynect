mongoose = require 'mongoose'
Plugins = require './Plugins'
Schema = mongoose.Schema

schema = new Schema
  name: String
  data: {}
  attributes: {}
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
