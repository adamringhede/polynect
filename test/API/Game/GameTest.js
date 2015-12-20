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


var devId = ObjectId();
var devId2 = ObjectId();
var clientId = ObjectId();
var adminId = ObjectId();
var fixtures = {
  Account: {
    d1: {
      _id: devId,
      role: 'developer',
      username: 'dev',
      password: 'pass'
    },
    d2: {
      _id: devId2,
      role: 'developer',
      username: 'dev2',
      password: 'pass'
    },
    admin: {
      _id: adminId,
      role: 'admin',
      username: 'dev',
      password: 'pass'
    }
  },

  Client: {
    c1: {
      _id: clientId,
      name: 'Test Client',
      client_id: 'client',
      secret: 'secret'
    }
  },
  AccessToken: {
    t1: {
      token: 'testtoken',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: devId
    },
    d2: {
      token: 'testtoken3',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: devId2
    },
    admin: {
      token: 'testtoken2',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: adminId
    }
  },
  Game: {
    g1: {
      _id: ObjectId(),
      name: 'Game',
      developer: devId
    },
    g2: {
      _id: ObjectId(),
      name: 'Game',
      developer: ObjectId()
    },
    g3: {
      _id: ObjectId(),
      name: 'Game',
      developer: devId2
    }
  }
}
describe('Games API', function () {


  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  })

  describe('POST', function () {

    it('creates a new game', function (done) {
      request(api).post('/v1/games')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .expect('Content-Type', 'application/json')
        .send({
          name: 'New game'
        })
        .expect(/new game/i, done);
    });

    describe('with another holder as developer', function () {
      it('returns 403', function (done) {
        request(api).post('/v1/games')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
          .expect('Content-Type', 'application/json')
          .send({
            name: 'New game',
            holder: adminId
          })
          .expect(403, done);
      })
    })
  });

  describe('PUT', function () {
    it('changes a game by id', function (done) {
      request(api).put('/v1/games/' + fixtures.Game.g1._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .expect('Content-Type', 'application/json')
        .send({
          _id: '123', // this should not affect anything
          name: 'New name'
        })
        .end(function (err, res) {
          assert.equal(res.body.data.name, 'New name');
          done()
        })
    });
  });

  describe('GET', function () {

    describe('list', function () {
      it('fetches a list of games', function (done) {
        request(api).get('/v1/games')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
          .expect('Content-Type', 'application/json')
          .end(function (err, res) {
            assert.equal(res.body.count, 3);
            assert.equal(res.body.data.length, 3);
            done()
          })
      });
      describe('as developer', function () {
        it('only fetches games held by the developer', function (done) {
          request(api).get('/v1/games')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
            .end(function (err, res) {
              assert.equal(res.body.count, 1);
              assert.equal(res.body.data.length, 1);
              done()
            })
        });
      })
    })

    describe('with id', function () {
      it('fetches the game', function (done) {
        request(api).get('/v1/games/' + fixtures.Game.g1._id)
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
          .expect('Content-Type', 'application/json')
          .expect(200, /Game/, done);
      });

      it('returns 404 if game does not exist', function (done) {
        request(api).get('/v1/games/' + ObjectId())
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
          .expect(404, done);
      })
    })

  });

  describe('DELETE', function () {
    it('fails if not held by developer', function (done) {
      request(api).delete('/v1/games/' + fixtures.Game.g1._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.d2.token)
        .expect(403, done);
    });
    it('works if admin', function (done) {
      request(api).delete('/v1/games/' + fixtures.Game.g1._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
        .expect(200, /deleted/i, done);
    });
    it('works holder of the game', function (done) {
      request(api).delete('/v1/games/' + fixtures.Game.g3._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.d2.token)
        .expect(200, /deleted/i, done);
    });
  })

});
