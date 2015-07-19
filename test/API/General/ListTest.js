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
    admin: {
      token: 'testtoken2',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: adminId
    }
  },
  Game: {}
}
describe('API General', function () {
  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  })

  describe('listing', function () {
    describe('without records', function () {
      it('only fetches games held by the developer', function (done) {
        request(api).get('/games')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
          .end(function (err, res) {
            assert.equal(res.body.count, 0);
            assert.equal(res.body.data.length, 0);
            done()
          })
      });
    })
  })

});
