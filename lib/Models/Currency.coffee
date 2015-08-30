mongoose = require 'mongoose'
Schema = mongoose.Schema

Currency = new Schema
  name: String
  product_id: String
  game: ref: 'Game', type: Schema.Types.ObjectId


module.exports = mongoose.model 'Currency', Currency
