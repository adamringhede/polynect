mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'

schema = new Schema
  name: type: String, required: true
  alias: String
  created: type: Date, default: Date.now()
  matchmaking_config: {}
  rate_limit: type: Number, default: 20

  #holder: type: Schema.Types.ObjectId, ref: 'Account' # now called developer
###
  config:
    player:
      default_data:
      starting_items:
      starting_currencies: [
        { id: '3123123124', amount: 250 },
        { id: '1241241241', amount: 10 }
      ]
    character:
      default_data:
      starting_items:
      starting_currencies:
###
schema.plugin Plugins.LastMod
schema.plugin Plugins.Redundancy,
  model: 'Game'
  references:
    developer:
      model: 'Account'
      fields: ['firstname']

module.exports = mongoose.model 'Game', schema
