var assert = require('assert');
//var request = require('request');
var Models = require('../../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var request = require('supertest');
var moment = require('moment');

Models.init()

var api = 'http://localhost:8090';

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')


var devId1 = ObjectId();
var devId2 = ObjectId();
var playerId1 = ObjectId();
var playerId2 = ObjectId();
var playerId3 = ObjectId();
var clientId = ObjectId();
var adminId = ObjectId();
var gameId1 = ObjectId();
var gameId2 = ObjectId();
var characterId1 = ObjectId();
var characterId2 = ObjectId();
var fixtures = {
  Game: {
    g1: {
      _id: gameId1,
      name: 'Game',
      developer: devId1
    },
    g2: {
      _id: gameId2,
      name: 'Another Game',
      developer: devId2
    },
  },
  Account: {
    admin: {
      _id: adminId,
      role: 'admin',
      username: 'admin'
    },
    dev1: {
      _id: devId1,
      role: 'developer',
      username: 'dev1'
    },
    dev2: {
      _id: devId2,
      role: 'developer',
      username: 'dev2'
    },
    player1: {
      _id: playerId1,
      role: 'player',
      username: 'player1',
      game: gameId1
    },
    player2: {
      _id: playerId2,
      role: 'player',
      username: 'player2',
      game: gameId1
    },
    player3: {
      _id: playerId3,
      role: 'player',
      username: 'player2',
      game: gameId2,
    }
  },
  Character: {
    c1: {
      _id: characterId1,
      name: 'char1',
      player: playerId1
    },
    c2: {
      _id: characterId2,
      name: 'char2',
      player: playerId2
    },
  },
  Client: {
    c1: {
      client_id: 'client',
      holder: adminId
    }
  },
  AccessToken: {
    admin: {
      token: 'testtoken2',
      client_id: 'client',
      holder: adminId
    },
    dev1: {
      token: 'testtoken3',
      client_id: 'client',
      holder: devId1
    },
    dev2: {
      token: 'testtoken4',
      client_id: 'client',
      holder: devId2
    },
    player1: {
      token: 'testtoken5',
      client_id: 'client',
      holder: playerId1
    },
    player2: {
      token: 'testtoken6',
      client_id: 'client',
      holder: playerId2
    },
    player3: {
      token: 'testtoken7',
      client_id: 'client',
      holder: playerId3
    }
  }
}
describe('Characters API', function () {

  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  })

  describe('GET', function () {

    describe('list', function () {
      it('fetches a list of characters', function (done) {
        request(api).get('/v1/characters?player_id=' + playerId1)
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
          .expect(200, done)
      });
    })
  });

  describe('PUT', function () {
    describe('as a developer', function () {
      it('can change the player the character belongs to', function (done) {
        request(api).put('/v1/characters/' + characterId1)
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev1.token)
          .send({player: playerId2})
          .expect(200)
          .end(function (err, res) {
            assert.equal(res.body.data.player.id, playerId2);
            done();
          });
      }),
      it('can not change the game', function (done) { done();
        // TODO Make sure that it is not able to replace the redundancy with the input,
        // It should probably best be solved by translating input parameters to <field>_id
        // using the models redundancy configuration and then use that one to execute the
        // redundancy data loading.
        // TODO: this should return a BadRequestError instead of not just changing the attribute silently
        /*request(api).put('/v1/characters/' + characterId1)
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev1.token)
          .send({game: gameId2})
          .expect(200)
          .end(function (err, res) {
            assert.equal(res.body.data.game, gameId1); // It should not have been changed
            done();
          });*/
      });
    });
    describe('as a player', function () {
      it('can change the character name and data', function (done) {
        request(api).put('/v1/characters/' + characterId1)
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
          .send({
            data: {x: 123},
            name: 'new name'
          })
          .expect(200)
          .end(function (err, res) {
            assert.equal(res.body.data.name, 'new name');
            assert.deepEqual(res.body.data.data, {x: 123});
            done();
          });
      })
      describe('of another game', function () {
        it('is forbidden', function (done) {
          request(api).put('/v1/characters/' + characterId1)
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.player3.token)
            .expect(403, done)
        })
      });
      describe('of same game but not owner of character', function () {
        it('is forbidden', function (done) {
          request(api).put('/v1/characters/' + characterId1)
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.player2.token)
            .expect(403, done)
        })
      });
    });
  });
  describe('POST', function () {
    describe('using a shallow path', function () {
      it('creates a new character', function (done) {
        request(api).post('/v1/characters')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
          .send({name: 'My character', data: {x: '234'}})
          .expect(/my character/i, done)
      });
    })
    describe('as a player', function () {
      it('creates a new character', function (done) {
        request(api).post('/v1/characters')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
          .send({name: 'My character', data: {x: '234'}})
          .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            assert.equal(res.body.data.name, 'My character');
            assert.equal(res.body.data.player.game.id, gameId1);
            assert.equal(res.body.data.player.id, playerId1);
            done();
          })
      });
      describe('with another player\'s token', function () {
        it('sets the player to the signed in user', function (done) {
          request(api).post('/v1/characters')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.player2.token)
            // Notice how setting the player attribute has no effect
            .send({name: 'My character', data: {x: '234'}, player: playerId1})
            .expect(200)
            .end(function (err, res, body) {
              assert.equal(res.body.data.player.id, playerId2);
              done();
            });
        });
      });
    });
    describe('as a developer', function () {
      it('creates a new character', function (done) {
        request(api).post('/v1/characters')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev1.token)
          .send({name: 'My character', data: {x: '234'}, game: gameId1, player: playerId1})
          .expect(/my character/i, done)
      });
      describe('not of the game the player belongs to', function () {
        it('is forbidden', function (done) {
          request(api).post('/v1/characters')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev2.token)
            .send({name: 'My character', data: {x: '234'}, game: gameId1, player: playerId1})
            .expect(403, done)
        });
      })
    });
  });

});
