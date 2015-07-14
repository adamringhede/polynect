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
  Account: {},
  Client: {
    c1: {
      _id: clientId,
      name: 'Test Client',
      client_id: 'client',
      secret: 'secret',
      holder: devId
    }
  },
  AccessToken: {}
}

describe('Access Token', function () {
  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      Models.Account.createWithCredentials({username: 'dev', password:'pass'}, done);
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
  })
});
