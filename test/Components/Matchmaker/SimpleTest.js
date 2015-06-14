var assert = require('assert');
var Models = require('../../../lib/Models');
var Matchmaker = require('../../../lib/Components/Matchmaker')
var ObjectId = require('objectid');
var Fixtures = require('pow-mongoose-fixtures');

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
  },
  Game: {
    g1: {
      _id: ObjectId(),
      name: 'Test game',
      matchmaking_config: require('./Configs/Simple')
    }
  },
  Match: {}

};


describe('Matchmaker', function () {
  var f = {};
  beforeEach(function (done) {
    Fixtures.load(fixtures, Models.connection, function () {
      var count = 0;
      Object.keys(fixtures).forEach(function (modelName) {
        f[modelName] = {};
        Object.keys(fixtures[modelName]).forEach(function (i) {
          if (fixtures[modelName][i]['_id']) {
            count += 1;
            Models[modelName].findOne({_id: fixtures[modelName][i]['_id']}, function (err, model) {
              f[modelName][i] = model;
              count -= 1;
              if (count == 0) {
                done();
              }
            });
          }
        });
      });
    });
  })

  it('creates a match if one cannot be found', function (done) {
    Matchmaker.findMatch({
      player: f.Player.p1,
      game: f.Game.g1,
      values: {
        y: 'bar'
      }
    }, function (err, match) {
      assert.equal(match.size, 1);
      assert.equal(match.attributes.y, 'bar');
      assert.equal(match.status, 'waiting');
      assert.equal(match.open, true);
      assert.equal(match.requests[0].player.id, f.Player.p1._id);
      done();
    });
  });
  it('does not put a player in the the same match twice', function (done) {
    Matchmaker.findMatch({
      player: f.Player.p1,
      game: f.Game.g1
    }, function (err, match) {
      Matchmaker.findMatch({
        player: f.Player.p1,
        game: f.Game.g1
      }, function (err, match2) {
        assert.equal(match.size, 1);
        assert.equal(match2.size, 1);
        done();
      });
    });
  });
  it('matches players with matching values', function (done) {
    Matchmaker.findMatch({
      player: f.Player.p1,
      game: f.Game.g1,
      values: { y: 'test' }
    }, function (err, match) {
      Matchmaker.findMatch({
        player: f.Player.p2,
        game: f.Game.g1,
        values: { y: 'test' }
      }, function (err, match2) {
        assert.equal(match2.size, 2);
        assert.equal(match2.requests.length, 2);
        assert.equal(match._id.toString(), match2._id.toString());
        done();
      });
    });
  });
  it('does not match players if their values differ', function (done) {
    Matchmaker.findMatch({
      player: f.Player.p1,
      game: f.Game.g1,
      values: { y: 'test' }
    }, function (err, match) {
      Matchmaker.findMatch({
        player: f.Player.p2,
        game: f.Game.g1,
        values: { y: 'not test' }
      }, function (err, match2) {
        assert.equal(match.size, 1);
        assert.equal(match2.size, 1);
        assert.notEqual(match._id.toString(), match2._id.toString());
        done();
      });
    });
  });


});
