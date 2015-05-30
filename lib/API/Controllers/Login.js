var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var request = require('request');

var providers = ['facebook'];
var providers_config = {
  'facebook': {
    url: 'https://graph.facebook.com/v2.3/',
    getUserId: function (access_token, callback) {
      if (process.env.MOCK_SERVICES) {
        if (typeof callback == 'function') callback('10153397865655452');
        return;
      }
      request(this.url + 'me?access_token=' + access_token, function (error, response, body) {
        // TODO: check for error
        var body = JSON.parse(body);
        if (typeof callback == 'function') callback(body.id);
      })
    }
  }
};

function findOrCreatePlayerWithProvider (uid, provider, callback) {
  Models.Player.findOneAndUpdate(
    {"provider.uid": uid, "provider.alias": provider},
    {}, {"upsert": true, "new": true} ,function (err, model, raw) {
      callback(err, model)
  });
}

module.exports = function (server) {
  server.post('/login/:provider', function (req, res, next) {
    var provider = req.params.provider.toLowerCase();
    if (providers.indexOf(provider) < 0) {
      res.send(403, "Provider " + provider + " is not a supported provider. Valid providers are: " + providers.join(', '));
      next(); return;
    }

    var pconf = providers_config[provider];
    pconf.getUserId(req.body.access_token, function (id) {
      findOrCreatePlayerWithProvider(id, provider, function (err, model) {
        if (err) {
          res.send(500, 'Internal server error');
          console.error(err);
        } else {
          res.send(200, Views.Player.authenticated(model))
        }
        next();
      })
    });
  });

  server.post('/login', function (req, res, next) {
    Models.Player.findWithCredentials(req.body.username, req.body.password, function (err, model) {
      if (err) {
        res.send(500, 'Internal server error');
        console.error(err);
      } else {
        if (!model) {
          res.send(401, 'Access denied');
        } else {
          res.send(200, Views.Player.authenticated(model))
        }

      }
      next();
    });
  });

}
