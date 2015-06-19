var assert = require('assert');
var Models = require('../../../lib/Models');
var Matchmaker = require('../../../lib/Components/Matchmaker')
var ObjectId = require('objectid');
var async = require('async');

Models.init('mongodb://localhost/polynect-test');

var fixtures = {
  Player: {
    p1: {
      _id: ObjectId(),
      username: 'adam@polynect.io',
    },
    p2: {
      _id: ObjectId(),
      username: 'david@polynect.io'
    },
    p3: {
      _id: ObjectId(),
      username: 'hacker@polynect.io'
    },
  },
  Game: {
    g1: {
      _id: ObjectId(),
      name: 'Test game',
      matchmaking_config: require('./Configs/Roles')
    },
  },
  Match: {}
};



describe('Matchmaking (roles)', function () {
  var f = {};

  function match(player, roles, callback) {
    Matchmaker.findMatch({
      player: f.Player[player],
      game: f.Game.g1,
      values: {
        roles: roles
      }
    }, callback);
  }

  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    })
  });
  describe ('delegations', function () {
    it ('selects the first role in the array', function (done) {
      match('p1', ['b', 'a'], function (err, match) {
        assert.equal(err, null);
        done();
      })
    });
  });
  describe('matching', function () {
    it ('does not match if role is filled', function (done) {
      async.series([
        function (callback) {
          match('p1', ['a'], callback)
        },
        function (callback) {
          match('p2', ['a'], function (err, match) {
            assert.equal(match.size, 1);
            callback();
          })
        }
      ], done);
    });
    it ('matches if the second request can fall back on another role', function (done) {
      async.series([
        function (callback) {
          match('p1', ['a'], callback)
        },
        function (callback) {
          match('p2', ['a', 'b'], function (err, match) {
            assert.equal(match.size, 2);
            callback();
          })
        }
      ], done);
    });
    it ('matches if the first request can fall back on another role', function (done) {
      async.series([
        function (callback) {
          match('p1', ['a', 'b'], callback)
        },
        function (callback) {
          match('p2', ['a'], function (err, match) {
            assert.equal(match.size, 2);
            assert.equal(match.roles.delegations.a.length, 1);
            assert.equal(match.roles.delegations.b.length, 1);
            assert.equal(match.roles.delegations.a[0].id.toString(), f.Player.p2._id.toString());
            assert.equal(match.roles.delegations.b[0].id.toString(), f.Player.p1._id.toString());
            callback();
          })
        }
      ], done);
    });
    it ('does not switch roles if switching is disabled', function (done) {
      f.Game.g1.matchmaking_config.roles.allowSwitching = false;
      f.Game.g1.markModified('matchmaking_config');
      f.Game.g1.save(function () {
        async.series([
          function (callback) {
            match('p1', ['a', 'b'], callback)
          },
          function (callback) {
            match('p2', ['a'], function (err, match) {
              assert.equal(match.size, 1);
              callback();
            })
          }
        ], done);
      })
    });

  })


});