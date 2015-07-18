Plugins = require './Plugins'
mongoose = require 'mongoose'
Schema = mongoose.Schema
Item = require './Item'


ItemSpec = new Schema
  name: String
  product_id: type: String
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
  default_count: type: Number, default: 1

ItemSpec.methods =
  getCopy: () ->
    item = new Item({
      name: @name,
      product_id: @product_id,
      game: @game,
      spec: @_id,
      access_level: @access_level,
      attributes: @attributes,
    })
    if @stackable
      item.stackable = yes
      item.count = @default_count
    else
      item.data = @data
    return item

ItemSpec.plugin Plugins.LastMod

onUpdate = () ->
  # Only do this if it has been changed
  mongoose.model('Item').collection.update({ spec: @_id }, { $set: {
    name: @name,
    product_id: @product_id,
    attributes: @attriubtes,
    access_level: @access_level
  } }, {
    multi: true,
    writeConcern: false
  })
ItemSpec.post 'save', onUpdate
ItemSpec.post 'update', onUpdate


module.exports = mongoose.model 'ItemSpec', ItemSpec
