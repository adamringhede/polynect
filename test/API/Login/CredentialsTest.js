var assert = require('assert');
var request = require('request');
var Models = require('../../../lib/Models');

Models.init('mongodb://localhost/polynect-test')

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')

var player = {
  username: 'adamringhede@live.com',
  password: 'secret'
};

describe('Login with credentials', function () {
  before(function (done) {
    // Clear database
    Models.Player.collection.remove();
    Models.Player.createWithCredentials(player.username, player.password, '213', function (err, model) {
      done();
    });
  });
  it('returns 401 if player does not exist with sent credentials', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/games/213/login',
      body: {username: player.username, password: 'wrong password'} }, function (err, res, body) {

        assert.equal(res.statusCode, 401);
        done();
      });
  });
  it('returns 200 if valid credentials are used', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/games/213/login',
      body: {username: player.username, password: player.password} }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(typeof body.token, 'string');
        assert.equal(typeof body.token_expires, 'string');
        done();
      });
  });
})
