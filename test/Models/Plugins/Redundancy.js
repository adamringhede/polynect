var assert = require('assert');
var Models = require('../../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var Schema = mongoose.Schema;
var Account = Models.Account;
var Schemas = Models.Schemas;

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
  }
};

describe('Redundancy', function () {
  var f = {};
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    })
  });


  describe('update', function () {
    var p = null;
    beforeEach(function () {
      p = new Account();
      p.update('firstname', 'Adam');
      p.update('game', f.Game.g0._id);
    })

    it ('has the same functionality as set', function () {
      assert.equal(p.firstname, 'Adam')
    });

    it ('keeps track of updated fields', function () {
      assert.equal(p.updatedFields.firstname, 'Adam');
    });

    it ('keeps track of updated references', function () {
      assert.equal(p.updatedReferences.game, f.Game.g0._id);
    });
  });


});
