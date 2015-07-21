Plugins = require './Plugins'
mongoose = require 'mongoose'
Schema = mongoose.Schema
Item = require './Item'


ItemSpec = new Schema
  name: String
  product_id: type: String # TODO validate unique combined with game
  game: type: Schema.Types.ObjectId, ref: 'Game'

  # Access level
  # 0: Only player can change
  # 1: Requires secret token
  access_level: type: Number, default: 0

  # Data
  # Attributes are not writable by clients can act as base values
  attributes: {}
  # Data can contain anything and might be writable by games
  data: {}

  # Type
  stackable: type: Boolean, default: false
  default_count: type: Number, default: 0

ItemSpec.methods =
  getCopy: () ->
    item = new Item({
      name: @name,
      product_id: @product_id,
      game: @game,
      itemSpec: @_id,
      access_level: @access_level,
      attributes: @attributes,
      stackable: @stackable
    })
    if @stackable
      item.count = @default_count
    else
      item.data = @data
    return item

ItemSpec.plugin Plugins.LastMod

ItemSpec.post 'save', () ->
  # Only do this if it has been changed
  mongoose.model('Item').collection.update({ itemSpec: @_id }, { $set: {
    name: @name,
    product_id: @product_id,
    attributes: @attriubtes,
    access_level: @access_level
  } }, {
    multi: true,
    writeConcern: false
  })


module.exports = mongoose.model 'ItemSpec', ItemSpec
