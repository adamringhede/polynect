var assert = require('assert');
//var request = require('request');
var Models = require('../../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var request = require('supertest');
var moment = require('moment');

Models.init()

var api = 'http://localhost:9999';

process.env.POLYNECT_API_PORT = 9999;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')


const devId = ObjectId();
const devId2 = ObjectId();
const clientId = ObjectId();
const adminId = ObjectId();
const gameId = ObjectId();
const hookId = ObjectId();
const fixtures = {
  Account: {
    admin: {
      _id: adminId,
      role: 'admin',
      username: 'admin',
      password: 'pass'
    },
    dev: {
      _id: devId,
      role: 'developer',
      username: 'dev',
      password: 'pass'
    },
    dev2: {
      _id: devId2,
      role: 'developer',
      username: 'dev2',
      password: 'pass'
    }
  },
  Game: {
    g1: {
      _id: gameId,
      name: 'Game',
      developer: devId
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
  Webhook: {
    w1: {
      _id: hookId,
      url: 'https://www.polynect.io/hooks',
      game: gameId
    }
  },
  AccessToken: {
    admin: {
      token: 'testtoken2',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: adminId
    },
    dev: {
      token: 'testtoken3',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: devId
    },
    dev2: {
      token: 'testtoken4',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: devId2
    }
  }
}
describe('Webhooks API', function () {

  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  })

  describe('GET', function () {
    describe('list', function () {
      ['dev', 'admin'].forEach((key) => {
        describe('as as ' + key, function () {
          it('fetches a list of webhooks', function (done) {
            request(api).get('/v1/webhooks')
              .set('Content-Type', 'application/json')
              .set('Authorization', 'Bearer ' + fixtures.AccessToken[key].token)
              .expect('Content-Type', 'application/json')
              .end(function (err, res) {
                assert.equal(res.body.count, 1);
                assert.equal(res.body.data.length, 1);
                done()
              })
          });
        })
      })
    })

    describe('by id', function () {
      ['dev', 'admin'].forEach((key) => {
        describe('as as ' + key, function () {
          it('fetches a single webhook', function (done) {
            request(api).get('/v1/webhooks/' + hookId)
              .set('Content-Type', 'application/json')
              .set('Authorization', 'Bearer ' + fixtures.AccessToken[key].token)
              .expect('Content-Type', 'application/json')
              .end(function (err, res) {
                assert.equal(res.statusCode, 200)
                assert.equal(res.body.data.url, fixtures.Webhook.w1.url);
                done()
              })
          });
        })
      })
    })
  });

  describe('POST', function () {
    const url = 'http://example.com';
    it('creates a new webhook', function (done) {
      request(api).post('/v1/webhooks')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev.token)
        .send({
          url: url,
          game: fixtures.Game.g1._id
        })
        .expect('Content-Type', 'application/json')
        .end(function (err, res) {
          assert.equal(res.statusCode, 200)
          assert.equal(res.body.data.url, url);
          done()
        })
    })
    it('requires the game to be held by the developer', function (done) {
      request(api).post('/v1/webhooks')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev2.token)
        .send({
          url: url,
          game: fixtures.Game.g1._id
        })
        .expect('Content-Type', 'application/json')
        .end(function (err, res) {
          assert.equal(res.statusCode, 403)
          done()
        })
    })
  })

  describe('PUT', function (done) {
    it('creates a new webhook', function (done) {
      request(api).put('/v1/webhooks/' + fixtures.Webhook.w1._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev.token)
        .send({
          url: "https://example.com/hooks",
        })
        .expect('Content-Type', 'application/json')
        .end(function (err, res) {
          assert.equal(res.statusCode, 200)
          assert.equal(res.body.data.url, "https://example.com/hooks")
          done()
        })
    })
    it('requires the game to be held by the developer', function (done) {
      request(api).put('/v1/webhooks/' + fixtures.Webhook.w1._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.dev2.token)
        .send({
          url: "https://example.com/hooks",
        })
        .expect('Content-Type', 'application/json')
        .end(function (err, res) {
          assert.equal(res.statusCode, 403)
          done()
        })
    })
  })
});
