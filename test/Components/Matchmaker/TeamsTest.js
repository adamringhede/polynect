var assert = require('assert');
var Models = require('../../../lib/Models');
var Matchmaker = require('../../../lib/Components/Matchmaker');
var ObjectId = require('objectid');
var async = require('async');

Models.init();

var fixtures = {
  Account: {
    p1: {
      _id: ObjectId(),
      username: 'adam@polynect.io'
    },
    p2: {
      _id: ObjectId(),
      username: 'david@polynect.io'
    },
    p3: {
      _id: ObjectId(),
      username: 'hacker@polynect.io'
    }
  },
  Game: {
    g1: {
      _id: ObjectId(),
      name: 'Test game',
      matchmaking_config: require('./Configs/TeamsSimple.json')
    }
  },
  Match: {},
  TeamsMatch: {}
};


describe('Matchmaking (teams)', function () {
  var f = {};

  function match(player, callback, game) {
    Matchmaker.findMatch({
      player: f.Account[player],
      game: game || f.Game.g1
    }, callback);
  }

  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    })
  });

  it('finds another team if one exists', function (done) {
    async.series([
      function (callback) {
        match('p1', callback)
      },
      function (callback) {
        match('p2', function (err, match) {
          // The first two players will create a match.
          assert.equal(match.size, 2);
          callback();
        })
      },
      function (callback) {
        // Using a timeout to prevent as the teams matching is event based
        setTimeout(() => {
          match('p3', function (err, match) {
            // A new match should be created and it will find the first team
            assert.equal(match.size, 1);
            Models.TeamsMatch.findOne({_id: match.teams_match}, (err, teams_match) => {
              assert.equal(teams_match.game_id.toString(), f.Game.g1._id.toString());
              assert.equal(teams_match.size, 2);
              assert.equal(teams_match.teams.length, 2);
              callback()
            });
          });
        }, 20);
      }
    ], done);
  });



});
