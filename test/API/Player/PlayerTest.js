var assert = require('assert');
//var request = require('request');
var Models = require('../../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var request = require('supertest');
var moment = require('moment');

Models.init('mongodb://localhost/polynect-test')

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')

var api = 'http://localhost:8090';

var gameId = ObjectId();
var playerId = ObjectId();
var clientId = ObjectId();
var fixtures = {
  Game: {
    g1: {
      _id: gameId,
      name: 'Test game'
    }
  },
  Account: {
    d1: {
      _id: playerId,
      role: 'player',
      username: 'adamringhede@live.com', // No need to provide password really
      game: gameId
    }
  },
  Client: {
    c1: {
      _id: clientId,
      name: 'Games',
      client_id: 'games',
      secret: 'secret'
    }
  },
  AccessToken: {
    t1: {
      token: 'testtoken',
      expires: moment().add(1, 'hours'),
      client_id: clientId,
      holder: playerId
    }
  }
}

var f;
beforeEach(function (done) {
  Models.load(fixtures, function (fixtures) {
    f = fixtures;
    done()
  });
})

describe('Players POST', function () {
  it('creates a new player', function (done) {
    request(api).post('/games/' + gameId + '/players')
      .set('Content-Type', 'application/json')
      // This endpoint does not need a token. Maybe a client/game id though?
      .send({username: 'adamringhede2@live.com', password: 'password'})
      .expect('Content-Type', 'application/json')
      .expect(200, /adamringhede2/i, done);
  })
});


describe('Players GET', function () {

  it('retrieves a player by id', function (done) {
    request(api).get('/games/' + gameId + '/players/' + playerId)
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
      .expect('Content-Type', 'application/json')
      .expect(200, /adamringhede/i, done);

  });
  it('returns 404 if player can not be found', function (done) {
    request(api).get('/games/' + gameId + '/players/' + ObjectId())
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
      .expect(404, done);
  })
});

describe('Players PUT', function () {


  describe('data', function () {
    it ('changes the data property of the player', function (done) {
      var actions = [{
          do: 'set',
          at: 'a.b',
          v: {
            n: 123,
            a: ['a']
          }
        }, {
          do: 'push',
          at: 'b',
          v: 'x'
        }, {
          do: 'insert',
          at: 'b',
          v: 'y'
        }, {
          do: 'empty',
          at: 'a.b.a'
        }
      ];


      request(api).put('/games/' + gameId + '/players/' + playerId + '/data')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({actions: actions})
        .end(function (err, res) {
          assert.equal(res.statusCode, 200);
          assert.deepEqual(res.body.data, {
            a: {
              b: {
                n: 123,
                a: []
              }
            },
            b: ['y', 'x']
          });
          done();
        });
    })
  })
})
