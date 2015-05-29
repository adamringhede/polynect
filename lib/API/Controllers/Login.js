var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var request = require('request');

var providers = ['facebook'];
var providers_config = {
  'facebook': {
    url: 'https://graph.facebook.com/v2.3/',
    getMeUrl: function (access_token) {
      return this.url + 'me?access_token=' + access_token
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
    if (typeof req.params.provider !== 'string') {
      res.send(403, 'Incorrect provider format'); next(); return;
    }
    var provider = req.params.provider.toLowerCase();
    if (providers.indexOf(provider) < 0) {
      res.send(403, "Provider " + provider + " is not a supported provider. Valid providers are: " + providers.join(', '));
      next(); return;
    }

    var pconf = providers_config[provider];
    request(pconf.getMeUrl(req.body.access_token), function (error, response, body) {
      // TODO: check for error
      var body = JSON.parse(body);
      var id = body.id;
      findOrCreatePlayerWithProvider(id, provider, function (err, model) {
        if (err) {
          res.send(500, err);
        } else {
          res.send(200, Views.Player.authenticated(model))
        }
        next();
      })
    })
  });

}
