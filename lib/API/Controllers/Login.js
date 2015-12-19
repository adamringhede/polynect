var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var restify = require('restify');
var $ = require('../Helpers/Tools');
var Providers = require('../Helpers/Providers');

module.exports = function(server) {

  server.post('/v1/games/:game/login/:provider',
    $.require('access_token'),
    $.load({game: 'Game'}),
    Providers.login('player'),
    $.createAccessToken('player', Models.Client.BASE_CLIENT_GAMES),
    $.output('player', Views.Player.withToken)
  );

  server.post('/v1/games/:game/login',
    $.require('username password'),
    $.load({game: 'Game'}),
    function(req, res, next) {
      Models.Account.findWithCredentials({username: req.body.username, password: req.body.password, game_id: req.params.game}, function(err, model) {
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
    $.createAccessToken('player', Models.Client.BASE_CLIENT_GAMES),
    $.output('player', Views.Player.withToken)
  );

  server.post('/v1/login',
    $.require('username password'),
    function(req, res, next) {
      Models.Account.findWithCredentials({username: req.body.username, password: req.body.password}, function(err, model) {
        if (err) {
          next(err);
        } else {
          if (!model) {
            next(new restify.errors.InvalidCredentialsError('Access denied'));
          } else {
            if (!req.resources) req.resources = {};
            req.resources['account'] = model;
            next();
          }
        }
      });
    },
    $.createAccessToken('account', Models.Client.DEV_PORTAL),
    function (req, res, next) {
      res.setHeader('Connection', 'close');
      next()
    },
    $.output('account', Views.Account.withToken)
  );

}
