var assert = require('assert');
var request = require('request');
var Models = require('../../../lib/Models');
var mongoose = require('mongoose');

Models.init('mongodb://localhost/polynect-test')

process.env.POLYNECT_API_PORT = 8090;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')


describe('Match POST', function () {
  var playerId = null;
  var gameId = null;
  before(function (done) {
    Models.Game.collection.remove(function () {
      Models.Player.collection.remove(function () {
        var g = new Models.Game({name: 'TestGame'});
        g.matchmaking_config = require('../../Components/MatchQuery/Configs/Complex');

        gameId = g._id;
        g.save(function () {
          Models.Player.createWithCredentials('adamringhede@live.com', 'secret', gameId, function (err, model) {
            playerId = model._id;
            Models.Match.collection.remove(done);
          })
        });
      });
    })
  })
  it('creates a match if one cannot be found', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/games/'+gameId+'/match',
      body: { player: playerId, values: {y: 'bar'} } }, function (err, res, body) {
        assert.equal(body.requests.length, 1);
        done();
      });
  });
});
