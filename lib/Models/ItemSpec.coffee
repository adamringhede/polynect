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
  class: String
  description: String

  # Access level
  # 0: Only player can change
  # 1: Requires secret token
  access_level: type: Number, default: 0

  # Attributes are not writable by clients can act as base values
  attributes: {}
  # Data can contain anything and might be writable by games
  # The item spec can include default data to be copied to new items
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
      item_spec: @_id,
      attributes: @attributes,
      stackable: @stackable
    })
    if @stackable
      item.count = @default_count
    else
      item.data = @data
    return item

schema.plugin Plugins.LastMod
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
