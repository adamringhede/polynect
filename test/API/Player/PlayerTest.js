var assert = require('assert');
var request = require('request');
var Models = require('../../../lib/Models');
var mongoose = require('mongoose');

Models.init('mongodb://localhost/polynect-test')

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')



describe('Players POST', function () {
  before(function (done) {
    // Clear database
    Models.Player.collection.remove(done);
  })
  it('creates a new player', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/games/213/players',
      body: {username: 'adamringhede@live.com', password: 'password'} }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(typeof body.token, 'string')
        done();
      });
  })
});


describe('Players GET', function () {
  var playerId = null;
  before(function (done) {
    Models.Player.collection.remove(function () {
      Models.Player.createWithCredentials('adamringhede@live.com', 'secret', '213', function (err, model) {
        playerId = model._id; done();
      })
    });
  })
  it('retrieves a player by id', function (done) {
    request({ method: 'GET', json: true, url: 'http://localhost:8090/games/213/players/' + playerId},
      function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body.username, 'adamringhede@live.com');
        done();
      });
  });
  it('returns 404 if player can not be found', function (done) {
    request({ method: 'GET', json: true, url: 'http://localhost:8090/games/213/players/' + mongoose.Types.ObjectId()},
      function (err, res, body) {
        assert.equal(res.statusCode, 404);
        done();
      });
  })
});
