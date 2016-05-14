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
var playerId = ObjectId();
var fixtures = {
  Account: {
    d1: {
      _id: devId,
      role: 'developer',
      firstname: 'Adam',
      lastname: 'Ringhede',
      username: 'dev',
      password: 'pass',
      email: 'adamringhede@live.com',
      activated: false,
      activation_token: 'test_activation_token'
    },
    admin: {
      _id: adminId,
      role: 'admin',
      username: 'dev',
      password: 'pass'
    },
    p1: {
      _id: playerId,
      role: 'player',
      username: 'playername',
      password: 'secret'
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
  },
  PasswordResetToken: {
    prt1: {
      token: 'resettoken',
      account: devId,
      email: 'adamringhede@live.com'
    }
  }
}
describe('Accounts API', function () {

  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  })

  describe('POST', function () {
    it('creates a new Account', function (done) {
      request(api).post('/v1/accounts')
        .set('Content-Type', 'application/json')
        .send({
          username: 'adam',
          password: 'secret'
        })
        .end(function (err, res) {
          assert.equal(200, res.statusCode);
          assert.equal(res.body.data.username, 'adam');
          done()
        })
    })
    it('fails if duplicate username', function (done) {
      request(api).post('/v1/accounts')
        .set('Content-Type', 'application/json')
        .send({
          username: 'dev',
          password: 'secret'
        })
        .expect(400)
        .end(function (err, res) {
          assert.ok('username' in res.body.errors);
          done()
        })
    })
    it('does not fail if a player has the same username', function (done) {
      request(api).post('/v1/accounts')
        .set('Content-Type', 'application/json')
        .send({
          username: 'playername',
          password: 'secret'
        })
        .expect(200)
        .end(function (err, res) {
          assert.equal(res.body.data.role, 'developer');
          assert.equal(res.body.data.username, 'playername');
          done()
        })
    });
  });


  describe('GET', function () {

    describe('list', function () {
      it('fetches a list of accounts', function (done) {
        request(api).get('/v1/accounts')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
          .expect('Content-Type', 'application/json')
          .end(function (err, res) {
            assert.equal(res.body.count, 3);
            assert.equal(res.body.data.length, 3);
            done()
          })
      });
      it('filters based on query parameters', function (done) {
        request(api).get('/v1/accounts?username=dev')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
          .end(function (err, res) {
            assert.equal(res.body.count, 2);
            assert.equal(res.body.data.length, 2);
            done()
          })
      });
      describe('as developer', function () {
        it('is forbidden', function (done) {
          request(api).get('/v1/accounts')
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Bearer ' + fixtures.AccessToken.d1.token)
            .expect(403, done);
        });
      })
    })

    describe('with id', function () {
      it('fetches the account', function (done) {
        request(api).get('/v1/accounts/' + fixtures.Account.d1._id)
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.d1.token)
          .expect('Content-Type', 'application/json')
          .expect(200, /adamringhede/, done);
      });

      it('returns 404 if account does not exist', function (done) {
        request(api).get('/v1/accounts/' + ObjectId())
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
          .expect(404, done);
      })
      describe('as developer', function () {
        it('returns 403 if trying to access another\'s account', function (done) {
          request(api).get('/v1/accounts/' + fixtures.Account.admin._id)
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

  describe('PUT', function () {
    it('changes attributes', function (done) {
      request(api).put('/v1/accounts/' + fixtures.Account.d1._id)
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
      request(api).put('/v1/accounts/' + fixtures.Account.d1._id)
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

  describe('DELETE', function () {
    it('removes the account', function (done) {
      request(api).delete('/v1/accounts/' + fixtures.Account.d1._id)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.admin.token)
        .expect(200, /deleted account/i, done);
    });
  })

    describe('Forgot password', function () {
      it('sends a reset password link', function (done) {
        request(api).post('/v1/accounts/forgot_password')
          .set('Content-Type', 'application/json')
          .send({ email: 'adamringhede@live.com' })
          .expect(200, /Reset password link sent/i, done);
      });
      it('validates that email exists', function (done) {
        request(api).post('/v1/accounts/forgot_password')
          .set('Content-Type', 'application/json')
          .send({ email: 'not_found@live.com' })
          .expect(400, /Could not be found/i, done);
      });
    });

    describe('Reset password', function () {
      it('sends accounts details via GET', function (done) {
        request(api).get('/v1/accounts/reset_password/resettoken')
          .set('Content-Type', 'application/json')
          .expect(200, /account/i, done);
      });
      it('sends 404 if unable to find GET', function (done) {
        request(api).get('/v1/accounts/reset_password/asflas')
          .set('Content-Type', 'application/json')
          .expect(404, done);
      });
      it('changes the password via POST', function (done) {
        request(api).post('/v1/accounts/reset_password/resettoken')
          .set('Content-Type', 'application/json')
          .send({password: 'new_pass'})
          .expect(200, /token/i, done);
      });
    });

    describe('Developer registration', function () {
      it('creates an activation token', function (done) {
        request(api).post('/v1/accounts/register')
          .set('Content-Type', 'application/json')
          .send({email: 'developer@polynect.io'})
          .expect(/access_token/)
          .expect(200, /developer@/i, done)
      })
      describe('activation', function () {
        it('returns account on GET', function (done) {
          request(api).get('/v1/accounts/activate/test_activation_token')
            .set('Content-Type', 'application/json')
            .expect(200, /name/i, done)
        })

        it('sets some user information', function (done) {
          request(api).post('/v1/accounts/activate/test_activation_token')
            .set('Content-Type', 'application/json')
            .send({firstname: 'john', lastname: 'doe', password: 'secret'})
            .expect(200, /john/i, done)
        })
      })

    });

});
