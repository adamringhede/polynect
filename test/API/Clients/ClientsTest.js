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
      client_id: 'client',
      holder: adminId
    }
  },
  AccessToken: {
    admin: {
      token: 'testtoken2',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: adminId
    }
  }

}
describe('Clients API', function () {

  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  })

  describe('GET', function () {

    describe('list', function () {
      it('fetches a list of clients', function (done) {
        request(api).get('/v1/clients')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
          .expect('Content-Type', 'application/json')
          .end(function (err, res) {
            assert.equal(res.body.count, 1);
            assert.equal(res.body.data.length, 1);
            done()
          })
      });
    })
  });

});
