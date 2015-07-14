var assert = require('assert');
var request = require('request');
var Models = require('../../../lib/Models');
var ObjectId = require('objectid');

Models.init('mongodb://localhost/polynect-test')

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')


var fixtures = {
  Account: {},
  Game: {
    g1: {
      _id: ObjectId(),
      name: 'Test game'
    }
  }

};

describe('Login with provider', function () {
  var f = {};
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    })
  });

  it('works with facebook', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/games/'+f.Game.g1._id+'/login/facebook',
      body: {access_token: 'token'} }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(typeof body.token.access_token, 'string');
        done();
      });

  });
});
