var assert = require('assert');
var request = require('request');
var Models = require('../../../lib/Models');
var ObjectId = require('objectid');

Models.init('mongodb://localhost/polynect-test')

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')

var player = {
  username: 'adamringhede@live.com',
  password: 'secret'
};

var gameId = ObjectId();
var fixtures = {
  Game: {
    g1: {
      _id: gameId,
      name: 'Test game'
    }
  },
  Account: {
    p1: {
      _id: ObjectId(),
      username: player.username,
      password_hash: Models.Account.hashPassword(player.password)
    }
  }

};

describe('Login with credentials', function () {
  var f = {};
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
    //  Models.Account.createWithCredentials({username: player.username, password: player.password, game: gameId}, done)
      done()
    })
  });

  it('returns 401 if player does not exist with sent credentials', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/games/'+gameId+'/login',
      body: {username: player.username, password: 'wrong password'} }, function (err, res, body) {
        assert.equal(res.statusCode, 401);
        done();
      });
  });
  it('returns 200 if valid credentials are used', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/games/'+gameId+'/login',
      body: {username: player.username, password: player.password} }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(typeof body.data.token.access_token, 'string');
        done();
      });
  });
})
