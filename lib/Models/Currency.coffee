mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'

schema = new Schema
  name: String
  product_id: String

schema.plugin Plugins.Redundancy,
  model: 'Currency'
  references:
    game:
      model: 'Game'

module.exports = mongoose.model 'Currency', schema
