var assert = require('assert');
var Models = require('../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var moment = require('moment');

Models.init()

var playerId = ObjectId();
var characterId = ObjectId();
var specId = ObjectId();
var c1 = ObjectId();
var c2 = ObjectId();
var fixtures = {
  Account: {
    p1: {
      _id: playerId,
      role: 'player',
      username: 'adamringhede@live.com',
      currencies: [{
        amount: 30,
        currency: c1,
      }, {
        amount: 4,
        currency: c2,
      }],
    }
  },
  Character: {
    c1: {
      _id: characterId,
      name: 'char1',
      player: playerId,
      currencies: [{
        amount: 30,
        currency: c1,
      }],
    },
  },
  Item: {},
  ItemSpec: {
    s0: {
      _id: specId,
      name: 'Test spec',
      product_id: 'test_spec',
      access_level: 1,
      cost: [{
        amount: 5,
        currency: c1
      }],
      attributes: {
        foo: 123
      }
    }
  },
}
describe('Buying an item', function () {

  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done()
    });
  })

  describe('as a player', function () {
    it('decreases the player\'s funds and adds an item to the player', function (done) {
      var player = f.Account.p1;
      var itemSpec = f.ItemSpec.s0;
      assert.ok(player.buy(itemSpec, function () {
          player.save(function (err, player) {
            assert.equal(player.currencies[0].amount, 25);

            // Test that the player received the item
            Models.Item.find({
              'player.id': player._id
            }, function (err, items) {
              assert.equal(items.length, 1);
              done();
            })
          });
        })
      )
    })
  })

  describe('as a character', function () {
    it('decreases the player\'s funds and adds an item to the player', function (done) {
      var character = f.Character.c1;
      var itemSpec = f.ItemSpec.s0;
      assert.ok(character.buy(itemSpec, function () {
          character.save(function (err, player) {
            assert.equal(character.currencies[0].amount, 25);

            // Test that the character received the item
            Models.Item.find({
              'character.id': character._id
            }, function (err, items) {
              assert.equal(items.length, 1);
              done();
            })
          });
        })
      )
    })
  })

})
