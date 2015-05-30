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

describe('Login with provider', function () {
  it('works with facebook', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/games/213/login/facebook',
      body: {access_token: 'token'} }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(typeof body.token, 'string');
        assert.equal(typeof body.token_expires, 'string');
        done();
      });

  });
});
