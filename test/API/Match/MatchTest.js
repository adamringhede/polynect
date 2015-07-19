var assert = require('assert');
//var request = require('request');
var Models = require('../../../lib/Models');
var Matchmaker = require('../../../lib/Components/Matchmaker');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var request = require('supertest');
var moment = require('moment');

Models.init()

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')

var api = 'http://localhost:8090';

var gameId = ObjectId();
var playerId = ObjectId();
var playerId2 = ObjectId();
var clientId = ObjectId();
var fixtures = {
  Match: {},
  Game: {
    g1: {
      _id: gameId,
      name: 'TestGame',
      matchmaking_config: require('../../Components/MatchQuery/Configs/Complex')
    }
  },
  Account: {
    p1: {
      _id: playerId,
      role: 'player',
      username: 'adamringhede@live.com', // No need to provide password really
      game: gameId
    },
    p2: {
      _id: playerId2,
      role: 'player',
      username: 'adamringhede2@live.com', // No need to provide password really
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
    },
    t2: {
      token: 'testtoken2',
      expires: moment().add(1, 'hours'),
      client_id: clientId,
      holder: playerId2
    }
  }
};
describe ('Match API', function () {


  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done()
    });
  })

  describe('POST', function () {

    it('creates a match if one cannot be found', function (done) {
      request(api).post('/v1/games/' + gameId + '/matches')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({ values: {y: 'bar'} })
        .expect('Content-Type', 'application/json')
        .end(function (err, res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.body.players.length, 1);
          done();
        });

    });
    it('adds the request to an existing match if one can be found', function (done) {
      request(api).post('/v1/games/' + gameId + '/matches')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({ values: {y: 'bar'} })
        .end(function (err, res) {
          request(api).post('/v1/games/' + gameId + '/matches')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.t2.token)
            .send({ values: {y: 'bar'} })
            .end(function (err, res2) {
              assert.equal(res2.statusCode, 200);
              assert.equal(res2.body.players.length, 2);
              done();
            });
        });
    });
  });

  describe('GET', function () {
    it('returns the view of an existing match', function (done) {
      request(api).post('/v1/games/' + gameId + '/matches')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({ values: {y: 'bar'} })
        .end(function (err, res) {
          request(api).get('/v1/games/' + gameId + '/matches/' + res.body.id)
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
            .expect('Content-Type', 'application/json')
            .end(function (err, res) {
              assert.equal(res.statusCode, 200);
              assert.equal(res.body.players.length, 1);
              done();
            });
        });

    })
  });

})
