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
var adminId = ObjectId();
var fixtures = {
  Account: {
    d1: {
      _id: devId,
      role: 'developer',
      username: 'dev',
      password: 'pass',
      email: 'adamringhede@live.com'
    },
    admin: {
      _id: adminId,
      role: 'admin',
      username: 'dev',
      password: 'pass'
    }
  },

  AccessToken: {
    d1: {
      token: 'testtoken',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: devId
    },
    admin: {
      token: 'testtoken2',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: adminId
    }
  }
}

var f;
beforeEach(function (done) {
  Models.load(fixtures, function (fixtures) {
    f = fixtures;
    done();
  });
})


describe('Accounts GET', function () {

  describe('list', function () {
    it('fetches a list of accounts', function (done) {
      request(api).get('/accounts')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
        .expect('Content-Type', 'application/json')
        .end(function (err, res) {
          assert.equal(res.body.count, 2);
          assert.equal(res.body.data.length, 2);
          done()
        })
    });
    describe('as developer', function () {
      it('is forbidden', function (done) {
        request(api).get('/accounts')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.d1.token)
          .expect(403, done);
      });
    })
  })

  describe('with id', function () {
    it('fetches the account', function (done) {
      request(api).get('/accounts/' + fixtures.Account.d1._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.d1.token)
        .expect('Content-Type', 'application/json')
        .expect(200, /adamringhede/, done);
    });

    it('returns 404 if account does not exist', function (done) {
      request(api).get('/accounts/' + ObjectId())
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
        .expect(404, done);
    })
    describe('as developer', function () {
      it('returns 403 if trying to access another\'s account', function (done) {
        request(api).get('/accounts/' + fixtures.Account.admin._id)
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.d1.token)
          .expect(403)
          .end(function (err, res) {
            assert.equal(res.body.code, 'ForbiddenError');
            done();
          });
      })
    })

  })

});

describe('Accounts PUT', function () {
  it('changes attributes', function (done) {
    request(api).put('/accounts/' + fixtures.Account.d1._id)
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
      .send({
        username: 'newusername'
      })
      .expect(200)
      .end(function (err, res) {
        assert.equal(res.body.data.username, 'newusername');
        done();
      });
  });
  it('performs validation', function (done) {
    request(api).put('/accounts/' + fixtures.Account.d1._id)
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
      .send({
        email: 'invalid email'
      })
      .expect(400)
      .end(function (err, res) {
        assert.ok('email' in res.body.errors)
        done();
      });
  });
});

describe('Accounts DELETE', function () {
  it('removes the account', function (done) {
    request(api).delete('/accounts/' + fixtures.Account.d1._id)
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
      .expect(200, /deleted account/i, done);
  });
})