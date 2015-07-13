var assert = require('assert');
var request = require('request');
var Models = require('../../../lib/Models');
var Matchmaker = require('../../../lib/Components/Matchmaker');
var mongoose = require('mongoose');
var ObjectId = require('objectid');

Models.init('mongodb://localhost/polynect-test')

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')

var gameId = ObjectId();
var fixtures = {
  Player: {},
  Match: {},
  Game: {
    g1: {
      _id: gameId,
      name: 'TestGame',
      matchmaking_config: require('../../Components/MatchQuery/Configs/Complex')
    }
  }
};

describe('Match POST', function () {
  var playerId = null;
  var token = null;
  var token2 = null;
  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      Models.Player.createWithCredentials('adamringhede@live.com', 'secret', gameId, function (err, p1) {
        Models.Player.createWithCredentials('adamringhede2@live.com', 'secret', gameId, function (err, p2) {
          playerId = p1._id;
          token = p1.token;
          token2 = p2.token;
          done();
        });
      })
    });
  });

  it('creates a match if one cannot be found', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/games/'+gameId+'/match' + '?access_token=' + token ,
      body: { values: {y: 'bar'} }, headers: { Authorization: token } }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body.players.length, 1);
        done();
      });
  });
  it('adds the request to an existing match if one can be found', function (done) {
    Models.Match.collection.remove(function () {
      request({ method: 'POST', json: true, url: 'http://localhost:8090/games/'+gameId+'/match' + '?access_token=' + token,
        body: { values: {y: 'bar'} }, headers: { Authorization: token } }, function (err, res, body) {
          request({ method: 'POST', json: true, url: 'http://localhost:8090/games/'+gameId+'/match' + '?access_token=' + token2,
            body: { values: {y: 'bar'} }, headers: { Authorization: token2 } }, function (err, res, body) {
              assert.equal(res.statusCode, 200);
              assert.equal(body.players.length, 2);
              done();
            });
        });
    });
  });
  describe('Match GET', function () {
    it('returns the view of an existing match', function (done) {
      request({ method: 'POST', json: true, url: 'http://localhost:8090/games/'+gameId+'/match' + '?access_token=' + token ,
        body: { values: {y: 'bar'} }, headers: { Authorization: token } }, function (err, res, body) {
          request.get('http://localhost:8090/games/'+gameId+'/matches/' + body.id + '?access_token=' + token, function (err, res, body2) {
            assert.equal(res.statusCode, 200);
            done();
          })
        });
    })
  });
});
