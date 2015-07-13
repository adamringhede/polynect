var assert = require('assert');
//var request = require('request');
var Models = require('../../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var request = require('supertest');
var moment = require('moment');

Models.init('mongodb://localhost/polynect-test')

var api = 'http://localhost:8090';

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')


var devId = ObjectId();
var clientId = ObjectId();
var fixtures = {
  Developer: {
    d1: {
      _id: devId,
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
    t1: {
      token: 'testtoken',
      expires: moment().add(1, 'hours'),
      client_id: clientId,
      holder: devId
    }
  }
}

describe('Games POST', function () {
  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  })
  it('creates a new game', function (done) {
    request(api).post('/games')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
      .expect('Content-Type', 'application/json')
      .send({
        name: 'New game'
      })
      .expect(200, /new game/i, done);
   /*
    request('http://localhost:8090').post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        client_id: 'client',
        client_secret: 'secret',
        username: 'dev',
        password: 'pass'
      })
      .expect(200, /user credentials are invalid/i, done);
      */
  })
});
