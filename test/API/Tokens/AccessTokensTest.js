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
      username: 'dev',
      password_hash: Models.Account.hashPassword('pass')
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
      secret: 'secret',
      holder: devId
    }
  },
  AccessToken: {
    admin: {
      _id: ObjectId(),
      token: 'testtoken2',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: adminId
    }
  }
}

describe('Access Token API', function () {
  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  })
  it('can be created using password grant', function (done) {
    request(api).post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        client_id: 'client',
        client_secret: 'secret',
        username: 'dev',
        password: 'pass'
      })
      .expect(200, /access_token/i, done);
  });

  describe('LIST', function () {
    it('fetches all access tokens', function (done) {
      request(api).get('/v1/accessTokens')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
        .expect('Content-Type', 'application/json')
        .expect(200, /token/, done);
    });
  });
  describe('GET', function () {
    it('fetches an access token', function (done) {
      request(api).get('/v1/accessTokens/' + fixtures.AccessToken.admin._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
        .expect('Content-Type', 'application/json')
        .expect(200, /token/)
        .end(function (err, res) {
          done();
        });
    });
  });

  describe('DELETE', function () {
    it('removes the token', function (done) {
      request(api).delete('/v1/accessTokens/' + fixtures.AccessToken.admin._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
        .expect('Content-Type', 'application/json')
        .expect(200, /deleted/i, done);
    });
  });

  describe('POST', function () {
    it('creates a new access token', function (done) {
      request(api).post('/v1/accessTokens')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
        .send({
          holder: devId,
          client_id: 'client',
          token: '0234j92093f2309f',
          lifetime: {
            value: 5,
            unit: 'years'
          }
        })
        .expect('Content-Type', 'application/json')
        .expect(200, /0234j92093f2309f/, done);
    });
  });
});
