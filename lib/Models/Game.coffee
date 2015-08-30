mongoose = require 'mongoose'
Schema = mongoose.Schema

game = new Schema
  name: String
  alias: String
  created: type: Date, default: Date.now()
  matchmaking_config: {}
  holder: type: Schema.Types.ObjectId, ref: 'Account'
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


module.exports = mongoose.model 'Game', game
