mongoose = require 'mongoose'
Schema = mongoose.Schema
Plugins = require './Plugins'

schema = new Schema
  name: type: String, required: true
  alias: String
  created: type: Date, default: Date.now()
  matchmaking_config: 
    attempts: type: Number, default: 1
    general: 
      min: type: Number, default: 2
      max: type: Number, default: 2
    teams:
      count: type: Number, default: 1
      match: 
        type: type: String, enum: ['same', 'different'], default: 'different'
        value: type: String
    attributes: {}
    ###
    This would require moving to an array, which could be good anyway.
    [{
      type: type: String, required: true, enum: ['same', 'interval', 'close']
      value: type: String, required: true
      default: required: false
      intervals: type: Array
    }]
    ###
    roles: 
      # Enabled should be set to false automatically when roles is empty, or it should be a method. 
      #enabled: type: Boolean, default: false
      allow_switching: type: Boolean, default: false
      value: type: String
      limits: {}

  rate_limit: type: Number, default: 20

  playfab:
    enabled: type: Boolean, default: false
    title_id: String
    secret_key: String
  
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
