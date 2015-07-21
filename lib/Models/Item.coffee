mongoose = require 'mongoose'
Schema = mongoose.Schema

schema = new Schema
  name: String

  character: type: Schema.Types.ObjectId, ref: 'Character'
  player: type: Schema.Types.ObjectId, ref: 'Player'
  game: type: Schema.Types.ObjectId, ref: 'Game'
  itemSpec: type: Schema.Types.ObjectId, ref: 'ItemSpec'


  product_id: String

  access_level: Number

  data: {}
  attributes: {}

  stackable: Boolean
  count: Number


module.exports = mongoose.model 'Item', schema
