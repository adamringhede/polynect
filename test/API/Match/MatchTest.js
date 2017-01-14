"use strict";

var assert = require('assert');
//var request = require('request');
var Models = require('../../../lib/Models');
var Matchmaker = require('../../../lib/Components/Matchmaker');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var request = require('supertest');
var moment = require('moment');
const async = require('async');

Models.init()

process.env.POLYNECT_API_PORT = 9999;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API');

var api = 'http://localhost:9999';

var gameId = ObjectId();
var gameId2 = ObjectId();
var gameId3 = ObjectId();
var playerId = ObjectId();
var playerId2 = ObjectId();
var devId = ObjectId();
var clientId = ObjectId();
var matchId = ObjectId();
var fixtures = {
  Match: {
    m1: {
      _id: matchId,
      game: gameId,
      status: 'waiting',
      data: {
        foo: 1
      }
    }
  },
  TeamsMatch: {},
  Game: {
    g1: {
      _id: gameId,
      name: 'TestGame',
      matchmaking_config: require('../../Components/MatchQuery/Configs/Complex'),
      developer: devId,
      playfab: {
        title_id: '14E9',
        secret_key: 'FR5MNGNWJCDM34C54XPQDNQ93K75Q47DASUYSJD8SPNWNR945Z'
      }
    },
    g2: {
      _id: gameId2,
      name: 'TestGameTeams',
      matchmaking_config: require('../../Components/Matchmaker/Configs/TeamsSimple'),
      developer: devId
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
    },
    d1: {
      _id: devId,
      role: 'developer',
      username: 'adamringhede3@live.com',
    }
  },
  Character: {
    c1: {
      _id: ObjectId(),
      game: gameId,
      player: playerId,
      name: 'A character',
      data: {
        b: 10
      }
    },
    c2: {
      _id: ObjectId(),
      game: gameId,
      player: playerId,
      name: 'Another character'
    },
    c3: {
      _id: ObjectId(),
      game: gameId,
      player: playerId2,
      name: 'Another players character'
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
    },
    t3: {
      token: 'testtoken3',
      expires: moment().add(1, 'hours'),
      client_id: clientId,
      holder: devId
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
  });

  describe('POST', function () {
    describe('as developer', function () {

      it('can add player to existing match', function(done) {
        // TODO Perform more testing with invalid input

        request(api).post('/v1/matches/match')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.t3.token)
          .send({ values: {y: 'bar'}, player: {id: "123"}, character: {b: 10}, game: gameId })
          .expect('Content-Type', 'application/json')
          .end(function (err, res) {
            request(api).post('/v1/matches/' + res.body.data.id + '/players')
              .set('Content-Type', 'application/json')
              .set('Authorization', 'Bearer ' + fixtures.AccessToken.t3.token)
              .send({ values: {y: 'bar'}, player: {id: "234"}, character: {b: 10}, game: gameId })
              .expect('Content-Type', 'application/json')
              .end(function (err, res) {
                  assert.equal(res.body.data.size, 2);
                  done();
              })
          })
      });

      describe('with PlayFab', function () {
        it('works by using player data from PlayFab', function (done) {
          request(api).post('/v1/matches/match')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'PlayFab 4D0B49ABE6175CB2---14E9-8D43C7B1944D9A0-24CD51C40FD4649B.55D25DE0DE830858')
            .send({ values: {y: 'bar'}, player: "4D0B49ABE6175CB2", game: gameId })
            .expect('Content-Type', 'application/json')
            .end(function (err, res) {
              assert.equal(res.statusCode, 200);
              done()
            })
        });
        it('fails gracefully if character does not exist', function (done) {
          request(api).post('/v1/matches/match')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'PlayFab 4D0B49ABE6175CB2---14E9-8D43C7B1944D9A0-24CD51C40FD4649B.55D25DE0DE830858')
            .send({ values: {y: 'bar'}, character: "123", game: gameId })
            .expect('Content-Type', 'application/json')
            .end(function (err, res) {
              assert.equal(res.statusCode, 400);
              done()
            })
        });
      });

      it ('works by passing in character data', function (done) {
        request(api).post('/v1/matches/match')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.t3.token)
          .send({ values: {y: 'bar'}, player: {id: "123"}, character: {b: 10}, game: gameId })
          .expect('Content-Type', 'application/json')
          .end(function (err, res) {
            request(api).post('/v1/matches/match')
              .set('Content-Type', 'application/json')
              .set('Authorization', 'Bearer ' + fixtures.AccessToken.t3.token)
              .send({ values: {y: 'bar'}, player: {id: "124"}, character: {id: "123", b: 10}, game: gameId })
              .expect('Content-Type', 'application/json')
              .end(function (err, res) {
                // It is possible to provide custom player ids
                assert.equal(res.body.data.players[0].id, "123");
                assert.equal(res.body.data.players[1].id, "124");
                assert.equal(res.statusCode, 200);
                assert.equal(res.body.data.players.length, 2);

                request(api).delete('/v1/matches/' + res.body.data.id + '/players/123')
                  .set('Content-Type', 'application/json')
                  .set('Authorization', 'Bearer ' + fixtures.AccessToken.t3.token)
                  .end(function (err, res) {
                    assert.equal(res.body.data.players.length, 1);
                    assert.equal(res.body.data.size, 1);
                    assert.equal(res.body.data.players[0].id, "124");
                    done();
                  })              
              });
          });
      });
      describe('with teams', () => {
        it('works with multiple request', (done) => {
          async.eachSeries(["1", "2", "3" ,"4"], (pid, callback) => {
            request(api).post('/v1/matches/match')
              .set('Content-Type', 'application/json')
              .set('Authorization', 'Bearer ' + fixtures.AccessToken.t3.token)
              .send({values: {y: 'bar'}, player: {id: pid}, character: {b: 10}, game: gameId2 })
              .end((err, res) => {
                assert.equal(res.statusCode, 200);
                callback(err);
              });
          }, () => {
            request(api).get('/v1/matches?game.id=' + gameId2)
              .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
              .end(function (err, res) {
                assert.equal(res.body.count, 2);
                done();
              });
          })
        });
      });
      describe('with multiple players', () => {
        it('works by passing in multiple requests in a group', (done) => {
          request(api).post('/v1/matches/match')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.t3.token)
            .send({ group: [
              {values: {y: 'bar'}, player: {id: "123"}, character: {b: 10}},
              {values: {y: 'bar'}, player: {id: "124"}, character: {b: 10}}
            ], game: gameId })
            .end((err, res) => {
              assert.equal(res.body.data.players[0].id, "123");
              assert.equal(res.body.data.players[1].id, "124");
              assert.equal(res.statusCode, 200);
              assert.equal(res.body.data.players.length, 2);
              done();
            });
        });

      });
    });

    it('returns 400 if bad input', function (done) {
      request(api).post('/v1/matches')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({ values: {}, character: fixtures.Character.c1._id, game: gameId })
        .end(function (err, res) {
          assert.equal(res.statusCode, 400);
          done();
        });
    });

    it('creates a match if one cannot be found', function (done) {
      request(api).post('/v1/matches')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({ values: {y: 'bar'}, character: fixtures.Character.c1._id, game: gameId })
        .expect('Content-Type', 'application/json')
        .end(function (err, res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.body.data.players.length, 1);
          done();
        });

    });

    describe('as an independent client', function () {
      // In this case, the client has the role of a developer and needs to include
      // the player's data and character data in the request and not just the id of
      // a player as that player will not exist on our system.
    });
    it('adds the request to an existing match if one can be found', function (done) {
      request(api).post('/v1/matches')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({
          options: {y: 'bar'},
          character: fixtures.Character.c1._id,
          game: gameId
        })
        .end(function (err, res) {
          request(api).post('/v1/matches')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.t2.token)
            .send({
              values: {y: 'bar'},
              character: fixtures.Character.c3._id,
              game: gameId
            })
            .end(function (err, res2) {
              assert.equal(res2.body.data.status, 'ready');
              assert.equal(res2.statusCode, 200);
              assert.equal(res2.body.data.players.length, 2);
              done();
            });
        });
    });
  });

  describe('PUT', function () {
    it('changes data incrementally', function (done) {
      request(api).put('/v1/matches/' + fixtures.Match.m1._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t3.token)
        .expect('Content-Type', 'application/json')
        .send({
          data: {
            bar: 2
          }
        })
        .end(function (err, res) {
          assert.equal(res.body.data.data.bar, 2);
          done()
        })
    })
  })

  describe('GET', function () {
    it('returns the view of an existing match', function (done) {
      request(api).post('/v1/matches')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({
          values: {y: 'bar'},
          character: fixtures.Character.c1._id,
          game: gameId
        })
        .end(function (err, res) {
          request(api).get('/v1/matches/' + res.body.data.id)
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
            .end(function (err, res) {
              assert.equal(res.body.data.attributes.z, 10);
              assert.equal(res.statusCode, 200);
              assert.equal(res.body.data.players.length, 1);
              done();
            });
        });

    })
    describe('list', function () {
      it('returns all matches for a game', function (done) {
        request(api).get('/v1/matches?game.id=' + gameId)
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
          .end(function (err, res) {
            assert.equal(res.body.count, 1);
            done();
          });
      })
    })
  });

  describe('Realtime', function () {
    it('sends updates in match', function (done) {

      //require('../../../lib/API/Sub');

      var WebSocketClient = require('websocket').client;

      request(api).post('/v1/matches')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({
          values: {y: 'bar'},
          character: fixtures.Character.c1._id,
          game: gameId
        })
        .end(function (err, res) {
          var client = new WebSocketClient();

          /*
          SubStub('ws://localhost:9999/matches/' + res.body.data.id, 'event-protocol').message(function (message) {

          });
          */

           
          client.on('connectFailed', function(error) {
              console.log('Connect Error: ' + error.toString());
          });
           
          client.on('connect', function(connection) {
              connection.on('error', function(error) {
                  console.log("Connection Error: " + error.toString());
              });
              connection.on('close', function() {
                  console.log('echo-protocol Connection Closed');
              });
              connection.on('message', function(message) {
                  var match = JSON.parse(message.utf8Data); 
                  assert.equal(match.players.length, 2);
                  done();
              });
          });
           
          client.connect('ws://localhost:9999/matches/' + res.body.data.id, 'match.polynect.io');

          request(api).post('/v1/matches')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.t2.token)
            .send({
              values: {y: 'bar'},
              character: fixtures.Character.c3._id,
              game: gameId
            })
            .end(function() {})
        });
    });
  });

})
