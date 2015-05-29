var assert = require('assert');
var request = require('request');
var Models = require('../../../lib/Models');

Models.init('mongodb://localhost/polynect-test')

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')

// Clear database
Models.Player.collection.remove();

var player = new Models.Player({
  username: 'adam.ringhede@live.com',
  password: 'secret'
});
player.save(function () {
  describe('Login with credentials', function () {
    it('returns 403 if player does not exist with sent credentials', function (done) {
      request({ method: 'POST', json: true, url: 'http://localhost:8090/login',
        body: {username: 'adamringhede@live.com', password: 'wrong password'} }, function (err, res, body) {
          assert.equal(res.statusCode, 403);
          done();
        });
    });
    it('returns a token if authentication suceeds', function (done) {
      request({ method: 'POST', json: true, url: 'http://localhost:8090/login',
        body: {username: player.username, password: player.password} }, function (err, res, body) {
          assert.equal(res.statusCode, 200);
          assert.equal(typeof body.token, 'string');
          assert.equal(typeof body.token_expires, 'string');
          done();
        });
    });
  })
})

describe('Login with provider', function () {
  it('works with facebook', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/login/facebook',
      body: {access_token: 'token'} }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(typeof body.token, 'string');
        assert.equal(typeof body.token_expires, 'string');
        done();
      });

  });
});
