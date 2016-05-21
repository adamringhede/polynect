var assert = require('assert');
var request = require('supertest');
var Models = require('../../../lib/Models');
var ObjectId = require('objectid');

Models.init()

process.env.POLYNECT_API_PORT = 9999;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')

var api = 'http://localhost:9999';

var gameId = ObjectId();
var playerId = ObjectId()
var fixtures = {
  Account: {
    p1: {
      _id: playerId,
      role: 'player',
      provider: {
        alias: 'facebook',
        uid: '10153397865655452'
      },
      game: gameId
    }
  },
  Game: {
    g1: {
      _id: gameId,
      name: 'player',
    }
  }

};

describe('Login with provider', function () {
  var f = {};
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    })
  });

  it('works with facebook', function (done) {
    request(api).post('/v1/games/' + gameId + '/login/facebook')
      .set('Content-Type', 'application/json')
      .send({access_token: 'token'})
      .expect(200, /bearer/i, done);
  })
});
