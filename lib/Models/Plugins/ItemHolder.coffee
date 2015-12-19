OPath = require 'object-path'
mongoose = require 'mongoose'
Schema = mongoose.Schema
Schemas = require '../Schemas'
Models = require '../Models'
_ = require 'underscore'

module.exports = (schema, options) ->
  schema.add
    currencies: [{
      _id: false,
      amount: Number,
      currency: String,
      name: String
    }]

  schema.methods.getCurrency = (id) -> _.findWhere(this.currencies, currency: id)

  schema.methods.buy =  (itemSpec, callback) ->
    unless @canAfford itemSpec
      callback? false, null
      return false
    for cost in itemSpec.cost
      holderCurrency = @getCurrency cost.currency
      holderAmount = holderCurrency?.amount or 0
      holderCurrency.amount -= cost.amount
    @addItem itemSpec, callback
    true

  schema.methods.canAfford = (itemSpec) ->
    insufficientFunds = false
    for cost in itemSpec.cost
      holderCurrency = @getCurrency cost.currency
      holderAmount = holderCurrency?.amount or 0
      if holderAmount - cost.amount < 0
        insufficientFunds = true
        break
    not insufficientFunds

  schema.methods._addItem = `function (spec, player, character, count, callback) {
    if (spec.stackable) {
      var query = {'item_spec.id': spec._id, 'player.id': player};
      if (character != null) {
        query['character.id'] = character;
      }
      Models.Item.findOne(query, function (err, item) {
        if (err) return callback(err);
        if (!item) {
          item = spec.getCopy();
          item.update('item_spec', spec, true);
          item.update('player', player, true);
          if (character) {
            item.update('character', character._id, true);
          }
        }
        item.count += count || 1;
        item.save(function (err, item) {
          callback(err, item);
        });
      });
    } else {
      var item = spec.getCopy();
      item.update('player', player, true);
      item.update('item_spec', spec, true);
      if (character) {
        item.update('character', character, true);
      }
      item.save(function (err, item) {
        if (err) callback(err);
        else {
          callback(null, item);
        }
      });
    }
   }`
