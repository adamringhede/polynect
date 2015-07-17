var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var restify = require('restify');
var $ = require('../Helpers/Tools');
var Providers = require('../Helpers/Providers');

module.exports = function(server) {

  server.post('/games/:game/login/:provider',
    $.require('access_token'),
    $.load({game: 'Game'}),
    Providers.login('player'),
    $.createAccessToken('player'),
    $.output('player', Views.Player.withToken)
  );

  server.post('/games/:game/login',
    $.require('username password'),
    $.load({game: 'Game'}),
    function(req, res, next) {
      Models.Account.findWithCredentials({username: req.body.username, password: req.body.password, game: req.params.game}, function(err, model) {
        if (err) {
          next(err);
        } else {
          if (!model) {
            next(new restify.errors.InvalidCredentialsError('Access denied'));
          } else {
            if (!req.resources) req.resources = {};
            req.resources['player'] = model;
            next();
          }
        }
      });
    },
    $.createAccessToken('player'),
    $.output('player', Views.Player.withToken)
  );

}
