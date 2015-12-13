var assert = require('assert');
var Models = require('../../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var Schema = mongoose.Schema;
var Account = Models.Account;
var Schemas = Models.Schemas;

Models.init();

var gameId = ObjectId();
var devId = ObjectId();
var fixtures = {
  Account: {
    d0: {
      _id: devId,
      firstname: 'Polynect'
    }
  },
  Game: {
    g0: {
      _id: gameId,
      name: 'Test game',
      developer: devId
    }
  }
};

var f = {};
beforeEach(function (done) {
  Models.load(fixtures, function (fixtures) {
    f = fixtures;
    done();
  })
});

describe('Redundancy', function () {
  var p = null;
  beforeEach(function (done) {
    p = new Account({
      role: 'player'
    });
    p.update('firstname', 'Adam');
    p.update('game', f.Game.g0._id);
    p.save(done);
  });

  describe('update', function () {
    it ('has the same functionality as set', function () {
      assert.equal(p.firstname, 'Adam')
    });

    it ('keeps track of updated fields', function () {
      assert.equal(p.updatedFields.firstname, 'Adam');
    });

    it ('keeps track of updated references', function () {
      assert.equal(p.updatedReferences.game, f.Game.g0._id);
      assert.equal(p.updatedFields.game, f.Game.g0._id);
    });
  });

  describe('global redundancy configuration', function () {
    it ('includes deep references', function () {
      var ok = false
      for (var i = 0, l = mongoose.redundancyConfig.Account.length; i < l; i++) {
        var config = mongoose.redundancyConfig.Account[i];
        if (config.path === 'game.developer') {
          ok = true;
        }
      }
      assert.ok(ok);
    });
  });

  describe('updates', function () {
    it ('changes the value on subscribing models', function (done) {
      var dev = f.Account.d0;
      dev.update('firstname', 'New name');
      dev.save(function () {
        Models.Account.findOne({_id: p._id}, function (err, player) {
          assert.equal(player.game.developer.firstname, 'New name');
          done();
        });
      })
    })
  })

  describe('reference change', function () {
    it ('sets specified redundant fields', function () {
      assert.equal(p.game.name, 'Test game');
      assert.equal(p.game.developer.id.toString(), devId.toString())
      assert.equal(p.game.developer.firstname, 'Polynect')
    });
  })

  /*
  TODO Test that changing the reference changes the redundant data for
  other models with multi level references
   */

});
