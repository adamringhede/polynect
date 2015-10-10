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
var clientId = ObjectId();
var adminId = ObjectId();
var fixtures = {
  Account: {
    d1: {
      _id: devId,
      role: 'developer',
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
    }
  }
}
describe('General API', function () {

  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  })

  describe('with access token as query param', function () {
    it('works', function (done) {
      request(api).get('/v1/accounts/' + devId + '?access_token=' + fixtures.AccessToken.t1.token)
        .set('Content-Type', 'application/json')
        .expect(200, /dev/i, done);
    });
  });

  describe('without version', function () {
    it('falls back to v1', function (done) {
      request(api).get('/accounts/' + devId)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .expect(200, /dev/i, done);
    });
  })

  describe('Supress status codes', function () {

    it('sets status code to 200 when resource is not found', function (done) {
      request(api).get('/v1/games/' + ObjectId() + '?suppress_response_codes=true')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .expect(200, /could not find Game/i)
        .end(function (err, res) {
          assert.equal(res.body.response_code, 404);
          done();
        });
    });

  });

  describe('Error', function () {
    it ('includes a message and code', function (done) {
      request(api).get('/errors/internal')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .expect(500)
        .end(function (err, res) {
          assert.equal(res.body.response_code, 500);
          assert.equal(res.body.code, 'InternalError');
          assert.equal(res.body.message, '"not a function" is not a function')
          done();
        });
    })
  })

  describe('Body parameter', function () {
    it('is trimmed from whitepsace', function (done) {
      request(api).put('/v1/accounts/' + devId)
        .set('ContentType', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({
          firstname: '    hello    '
        })
        .end(function (err, res) {
          assert.equal(res.body.data.firstname, 'hello')
          done();
        });
    })
  })

});
