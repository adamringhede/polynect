Plugins = require './Plugins'
mongoose = require 'mongoose'
Plugins = require './Plugins'
Schema = mongoose.Schema
Item = require './Item'

# This should be renambed to Product if it produces an item.
# A new model should be created called Model that produces objects
# for more complex data stores.
schema = new Schema
  name: String
  product_id: type: String # TODO validate unique combined with game
  #game: type: Schema.Types.ObjectId, ref: 'Game'
  #
  # TODO add more default attributes such as item class, description, etc.

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

  # This should be a plugin
  cost: [{
    amount: Number,
    currency: String,
    name: String
  }]

schema.methods =
  getCopy: () ->
    item = new Item({
      name: @name,
      product_id: @product_id,
      item_spec: @_id,
      access_level: @access_level,
      attributes: @attributes,
      stackable: @stackable
    })
    if @stackable
      item.count = @default_count
    else
      item.data = @data
    return item

schema.plugin Plugins.Redundancy,
  model: 'ItemSpec'
  references:
    game:
      model: 'Game'
      references:
        developer:
          model: 'Account'

schema.plugin Plugins.LastMod

module.exports = mongoose.model 'ItemSpec', schema
