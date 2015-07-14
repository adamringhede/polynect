var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var request = require('request');
var OAuth = require('../OAuth');
var moment = require('moment');

var providers = ['facebook'];
var providers_config = {
  'facebook': {
    url: 'https://graph.facebook.com/v2.3/',
    getUserId: function(access_token, callback) {
      if (process.env.MOCK_SERVICES) {
        if (typeof callback == 'function') return callback('10153397865655452');
      }
      request(this.url + 'me?access_token=' + access_token, function(error, response, body) {
        // TODO: check for error
        var body = JSON.parse(body);
        if (typeof callback == 'function') callback(body.id);
      })
    }
  }
};

function findOrCreatePlayerWithProvider(uid, provider, gameId, callback) {
  Models.Account.findOneAndUpdate({
    role: 'player',
    "provider.uid": uid,
    "provider.alias": provider,
    game: gameId
  }, {}, {
    upsert: true,
    "new": true
  }, function(err, model, raw) {
    callback(err, model)
  });
}

function getPlayerToken(player, req, callback) {
  // if one player only can have one session active, then remove all existing access_tokens
  // this could be a configuration in the game
  // The expiration date should be configurable
  OAuth.generateToken('accessToken', req, function (err, access_token) {
    OAuth.saveAccessToken(access_token, Models.Client.BASE_CLIENT_GAMES, moment().add(1, 'year'), player, callback);
  });
}

module.exports = function(server) {
  server.post('/games/:game/login/:provider', function(req, res, next) {
    var provider = req.params.provider.toLowerCase();
    var gameId = req.params.game
    if (providers.indexOf(provider) < 0) {
      res.send(403, "Provider " + provider + " is not a supported provider. Valid providers are: " + providers.join(', '));
      next();
      return;
    }

    var pconf = providers_config[provider];
    pconf.getUserId(req.body.access_token, function(id) {
      findOrCreatePlayerWithProvider(id, provider, gameId, function(err, model) {
        if (err) {
          res.send(500, 'Internal server error');
          console.error(err);
        } else {
          getPlayerToken(model, req, function (err, token) {
            if (err) res.send(500, 'Failed to create access token')
            else res.send(200, Views.Player.withToken(model, token))
          })
        }
        next();
      })
    });
  });

  server.post('/games/:game/login', function(req, res, next) {
    Models.Account.findWithCredentials({username: req.body.username, password: req.body.password, game: req.params.game}, function(err, model) {
      if (err) {
        res.send(500, 'Internal server error');
      } else {
        if (!model) {
          res.send(401, 'Access denied');
        } else {
          getPlayerToken(model, req, function (err, token) {
            if (err) res.send(500, 'Failed to create access token')
            else res.send(200, Views.Player.withToken(model, token))
          })

        }

      }
      next();
    });
  });

}
