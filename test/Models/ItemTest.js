var assert = require('assert');
var Models = require('../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var Item = Models.Item;
var account = Models.Account;

Models.init();

var gameId = ObjectId();
var specId = ObjectId();
var fixtures = {
  Account: {},
  Game: {
    g0: {
      _id: gameId,
      name: 'Test game'
    }
  },
  ItemSpec: {
    is0: {
      _id: specId,
      name: 'Test spec',
      product_id: 'test_spec',
      game: gameId,
      access_level: 1,
      attributes: {
        foo: 123
      }
    }
  },
  Item: {
    i1: {
      item_spec: specId
    }
  }
};


describe('Item', function () {
  var f = {};
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    })
  });
  it ('is changed if its spec is changed and saved', function (done) {
    var spec = f.ItemSpec.is0;
    var item = spec.getCopy();
    item.save(function (err, item) {
      assert.equal(item.item_spec.product_id, 'test_spec');
      item.save(function () {
        spec.update('product_id', 'new_test_spec')
        spec.save(function () {
          Item.find({'item_spec.product_id': 'new_test_spec'}, function (err, items) {
            assert.equal(items.length, 2);
            done()
          });
        });
      });
    })
  });


});
