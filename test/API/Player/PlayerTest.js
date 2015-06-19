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
  var gameId = null;
  before(function (done) {
    // Clear database
    Models.Game.collection.remove(function () {
      Models.Player.collection.remove(function () {
        var g = new Models.Game({name: 'TestGame'});
        gameId = g._id; g.save(done);
      });
    });
  })
  it('creates a new player', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/games/'+gameId+'/players',
      body: {username: 'adamringhede@live.com', password: 'password'} }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(typeof body.token, 'string')
        done();
      });
  })
});


describe('Players GET', function () {
  var playerId = null;
  var gameId = null;
  before(function (done) {
    Models.Game.collection.remove(function () {
      Models.Player.collection.remove(function () {
        var g = new Models.Game({name: 'TestGame'});
        gameId = g._id;
        g.save(function () {
          Models.Player.createWithCredentials('adamringhede@live.com', 'secret', gameId, function (err, model) {
            playerId = model._id;
            done()
          })
        });
      });
    })
  })
  it('retrieves a player by id', function (done) {
    request({ method: 'GET', json: true, url: 'http://localhost:8090/games/'+gameId+'/players/' + playerId},
      function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body.username, 'adamringhede@live.com');
        done();
      });
  });
  it('returns 404 if player can not be found', function (done) {
    request({ method: 'GET', json: true, url: 'http://localhost:8090/games/'+gameId+'/players/' + mongoose.Types.ObjectId()},
      function (err, res, body) {
        assert.equal(res.statusCode, 404);
        done();
      });
  })
});

describe('Players PUT', function () {
  var playerId = null;
  var gameId = null;
  var token = null;
  beforeEach(function (done) {
    Models.Game.collection.remove(function () {
      Models.Player.collection.remove(function () {
        var g = new Models.Game({name: 'TestGame'});
        gameId = g._id;
        g.save(function () {
          Models.Player.createWithCredentials('adamringhede@live.com', 'secret', gameId, function (err, model) {
            playerId = model._id;
            token = model.token;
            done()
          })
        });
      });
    })
  })

  describe('data', function () {
    it ('changes the data property of the player', function (done) {
      var actions = [{
          do: 'set',
          at: 'a.b',
          v: 123
        }, {
          do: 'push',
          at: 'b',
          v: 'x'
        }
      ];

      request({ method: 'PUT', json: true, url: 'http://localhost:8090/games/'+gameId+'/players/' + playerId + '/data?access_token=' + token,
        body: {actions: actions} },
        function (err, res, body) {
          assert.equal(res.statusCode, 200);
          assert.deepEqual(body.data, {
            a: {
              b: 123
            },
            b: ['x']
          });
          done();
        });
    })
  })
})
