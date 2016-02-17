var assert = require('assert');
var Models = require('../../../lib/Models');
var Matchmaker = require('../../../lib/Components/Matchmaker')
var ObjectId = require('objectid');

Models.init();

var fixtures = {
  Account: {
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
      matchmaking_config: require('./Configs/Simple')
    },
    g2: {
      _id: ObjectId(),
      name: 'Another game',
      matchmaking_config: require('./Configs/Simple')
    }
  },
  Match: {}

};


describe('Matchmaker', function () {
  var f = {};
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    })
  })

  it('creates a match if one cannot be found', function (done) {
    Matchmaker.findMatch({
      player: f.Account.p1,
      game: f.Game.g1,
      values: {
        y: 'bar'
      }
    }, function (err, match) {
      assert.equal(match.size, 1);
      assert.equal(match.attributes.y, 'bar');
      assert.equal(match.status, 'waiting');
      assert.equal(match.open, true);
      assert.equal(match.requests[0].player.id, f.Account.p1._id);
      done();
    });
  });
  it('does not put a player in the the same match twice', function (done) {
    Matchmaker.findMatch({
      player: f.Account.p1,
      game: f.Game.g1
    }, function (err, match) {
      Matchmaker.findMatch({
        player: f.Account.p1,
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
      player: f.Account.p1,
      game: f.Game.g1,
      values: { y: 'test' }
    }, function (err, match) {
      Matchmaker.findMatch({
        player: f.Account.p2,
        game: f.Game.g1,
        values: { y: 'test' }
      }, function (err, match2) {
        assert.notEqual(match2.requests[0].player.id, match2.requests[1].player.id);
        assert.equal(match2.size, 2);
        assert.equal(match2.requests.length, 2);
        assert.equal(match._id.toString(), match2._id.toString());
        done();
      });
    });
  });
  it('does not match players if their values differ', function (done) {
    Matchmaker.findMatch({
      player: f.Account.p1,
      game: f.Game.g1,
      values: { y: 'test' }
    }, function (err, match) {
      Matchmaker.findMatch({
        player: f.Account.p2,
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
  it('does not add a player to a full match', function (done) {
    Matchmaker.findMatch({
      player: f.Account.p1,
      game: f.Game.g1,
    }, function (err, match) {
      Matchmaker.findMatch({
        player: f.Account.p2,
        game: f.Game.g1,
      }, function (err, match2) {
        Matchmaker.findMatch({
          player: f.Account.p3,
          game: f.Game.g1,
        }, function (err, match3) {
          assert.equal(match2.size, 2);
          assert.equal(match3.size, 1);
          assert.equal(match._id.toString(), match2._id.toString());
          assert.notEqual(match._id.toString(), match3._id.toString());
          done();
        });
      });
    });
  });
  it('does not match players if the game differs', function (done) {
    Matchmaker.findMatch({
      player: f.Account.p1,
      game: f.Game.g1,
    }, function (err, match) {
      Matchmaker.findMatch({
        player: f.Account.p2,
        game: f.Game.g2
      }, function (err, match2) {
        assert.equal(match.size, 1);
        assert.equal(match2.size, 1);
        assert.notEqual(match._id.toString(), match2._id.toString());
        done();
      });
    });
  });
  it('creates millions of documents', function (done) {
    return done();
    this.timeout(10 * 60 * 1000);
    require('async').timesSeries(20000, function (n, next) {
      var player = new Models.Account({role:'player', data: {}});
      Matchmaker.findMatch({
        player: player,
        game: f.Game.g1,
        values: {
          y: 'bar' + Math.floor(Math.random() * 5)
        }
      }, function (err, match) {
        next()
      });
    }, function (result) {
      done();
    })
  });



});
