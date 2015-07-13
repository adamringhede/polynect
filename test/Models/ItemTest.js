var assert = require('assert');
var Models = require('../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var Item = Models.Item;
var Player = Models.Player;

Models.init('mongodb://localhost/polynect-test');

var gameId = ObjectId();

var fixtures = {
  Player: {},
  Game: {
    g0: {
      _id: gameId,
      name: 'Test game'
    }
  },
  ItemSpec: {
    is0: {
      _id: ObjectId(),
      name: 'Test spec',
      product_id: 'test_spec',
      game: gameId,
      access_level: 1,
      attributes: {
        foo: 123
      }
    }
  },
  Item: {}
};


describe('Item', function () {
  var f = {};
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    })
  });
  it ('is changed if its spec is changed', function (done) {
    var spec = f.ItemSpec.is0;
    var item = spec.getCopy();
    assert.equal(item.product_id, 'test_spec');
    item.save(function () {
      spec.product_id = 'new_test_spec';
      spec.save(function () {
        Item.findOne({_id: item._id}, function (err, item) {
          assert.equal(item.product_id, 'new_test_spec');
          done()
        });
      });
    });
  });

});
