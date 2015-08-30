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
var specId1 = ObjectId();
var specId2 = ObjectId();
var specId3 = ObjectId();
var itemId1 = ObjectId();
var itemId2 = ObjectId();
var fixtures = {
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
  Game: {
    g1: {
      _id: gameId1,
      name: 'Game',
      holder: devId1
    },
    g2: {
      _id: gameId2,
      name: 'Another Game',
      holder: devId2
    },
  },
  Character: {
    c1: {
      _id: characterId1,
      name: 'char1',
      game: gameId1,
      player: playerId1
    },
    c2: {
      _id: characterId2,
      name: 'char2',
      game: gameId1,
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
  },
  Item: {
    item1: {
      _id: itemId1,
      itemSpec: specId2,
      count: 5,
      stackable: true,
      player: playerId1,
      game: gameId1
    },
    item2: {
      _id: itemId2,
      name: 'item name',
      itemSpec: specId1,
      character: characterId1,
      player: playerId1,
      game: gameId1
    }
  },
  ItemSpec: {
    spec1: {
      _id: specId1,
      name: 'Test spec',
      product_id: 'test_spec_one',
      game: gameId1,
      access_level: 1,
      attributes: {
        foo: 123
      }
    },
    spec2: {
      _id: specId2,
      name: 'Test spec',
      product_id: 'test_spec_two',
      game: gameId1,
      access_level: 1,
      stackable: true,
      attributes: {
        foo: 234
      }
    },
    spec3: {
      _id: specId3,
      name: 'Test spec',
      product_id: 'test_spec_three',
      game: gameId2,
      access_level: 0,
      stackable: true,
      attributes: {
        foo: 456
      }
    }
  }
}
describe('Items API', function () {

  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  });
  describe('POST', function () {
    // Test access
    describe('as a player', function () {
      it('works', function (done) {
        request(api).post('/v1/games/' + gameId1 + '/players/' + playerId1 + '/items')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
          .send({
            itemSpec: specId1
          })
          .end(function (err, res, data) {
            console.log(res.body)
            assert.equal(res.statusCode, 200);
            assert.equal(res.body.data.product_id, 'test_spec_one');
            done()
          });
      });
      describe('to character', function () {
        it('sets the character', function (done) {
          request(api).post('/v1/games/' + gameId1 + '/players/' + playerId1 + '/characters/' + characterId1 + '/items')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
            .send({
              itemSpec: specId1
            })
            .end(function (err, res) {
              assert.equal(res.statusCode, 200);
              assert.equal(res.body.data.character, characterId1)
              done()
            })
        })

        describe('of another player', function () {
          it('is forbidden', function (done) {
            request(api).post('/v1/games/' + gameId1 + '/players/' + playerId2 + '/characters/' + characterId2 + '/items')
              .set('Content-Type', 'application/json')
              .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
              .send({
                itemSpec: specId1
              })
              .expect(403, done)
          })
          describe('with self as player', function () {
            it('is forbidden', function (done) {
              request(api).post('/v1/games/' + gameId1 + '/players/' + playerId1 + '/characters/' + characterId2 + '/items')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
                .send({
                  itemSpec: specId1
                })
                .expect(400, done)
            })
          })
        })
      });
    });

    describe('as another player', function () {
      it('is forbidden', function (done) {
        request(api).post('/v1/games/' + gameId1 + '/players/' + playerId1 + '/items')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player2.token)
          .send({
            itemSpec: specId1
          }).expect(403, done);
      })
    })

    describe('as a developer', function () {
      it('works', function (done) {
        request(api).post('/v1/games/' + gameId1 + '/players/' + playerId1 + '/items')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev1.token)
          .send({
            itemSpec: specId1
          }).expect(200, done)
      });
      describe('not of the game the player belongs to', function () {
        it('is forbidden', function (done) {
          request(api).post('/v1/games/' + gameId1 + '/players/' + playerId1 + '/items')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev2.token)
            .send({
              itemSpec: specId1
            }).expect(403, done);
        })
      })
    });

    describe('spec is from another game', function () {
      it('is a bad request', function (done) {
        request(api).post('/v1/games/' + gameId1 + '/players/' + playerId1 + '/characters/' + characterId1 + '/items')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
          .send({
            itemSpec: specId3
          })
          .expect(404, /of game/i, done)
      })
    })

    // Test stackable item
    describe('item is stackable', function () {
      describe('without count as a parameter', function () {
        it('increments by one', function (done) {
          request(api).post('/v1/games/' + gameId1 + '/players/' + playerId1 + '/items')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev1.token)
            .send({
              itemSpec: specId2
            })
            .end(function (err, res) {
              console.log(res.body)
              assert.equal(res.statusCode, 200);
              assert.equal(res.body.data.stackable, true);
              assert.equal(res.body.data.count, 6);
              done();
            });
        })
      })
      describe('with count as a parameter', function () {
        it('increments the items current count', function (done) {
          request(api).post('/v1/games/' + gameId1 + '/players/' + playerId1 + '/items')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev1.token)
            .send({
              itemSpec: specId2,
              count: 4
            })
            .end(function (err, res) {
              assert.equal(res.statusCode, 200);
              assert.equal(res.body.data.stackable, true);
              assert.equal(res.body.data.count, 9); // Sets the count to one if a count is not specified
              done();
            });
        })
      })
    });

    describe('using shallow paths', function () {
      it('works for players', function (done) {
        request(api).post('/v1/players/' + playerId1 + '/items')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
          .send({
            itemSpec: specId1
          })
          .expect(200, done)
      });
      it('works for characters', function (done) {
        request(api).post('/v1/characters/' + characterId1 + '/items')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
          .send({
            itemSpec: specId1
          })
          .expect(200, done)
      });
    });

  })

  describe('PUT', function () {
    describe('as a player of an item owned by one of its characters', function () {
      it('works', function (done) {
        request(api).put('/v1/items/' + itemId2)
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
          .send({
            name: 'New item name'
          })
          .expect(200, /new item name/i, done)
      });
    });

    describe('as a player of an item owned by same player', function () {
      it('works', function (done) {
        request(api).put('/v1/items/' + itemId1)
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
          .send({
            name: 'New item name'
          })
          .expect(200, /new item name/i, done)
      });
    });

    describe('as a developer', function () {
      it('works if the player belongs to a game that the developer has access to', function (done) {
        request(api).put('/v1/items/' + itemId1)
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev1.token)
          .send({
            name: 'New item name'
          })
          .expect(200, /new item name/i, done)
      });
      it('is forbidden if the developer does not have access to the game', function (done) {
        request(api).put('/v1/items/' + itemId1)
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev2.token)
          .send({
            name: 'New item name'
          })
          .expect(403, done)
      });
    });
  });

  describe('DELETE', function () {
    describe('as a player of an item owned by one of its characters', function () {
      it('works', function (done) {
        request(api).delete('/v1/items/' + itemId2)
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
          .expect(200, /deleted item/i, done)
      });
    })
  });

  describe('GET', function () {
    it('lists character items', function (done) {
      request(api).get('/v1/characters/' + characterId1 + '/items')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
        .end(function (err, res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.body.count, 1);
          done();
        });
    });
    it('lists player items', function (done) {
      request(api).get('/v1/players/' + playerId1 + '/items')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.player1.token)
        .end(function (err, res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.body.count, 2);
          done();
        });
    });
  })


});
