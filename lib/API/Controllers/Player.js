var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');

module.exports = function(server) {
  server.get('/games/:game/players/:player', function(req, res, next) {
    Models.Game.findOne({
      _id: req.params.game
    }, function(err, model) {
      if (err) {
        res.send(500, 'Could not retrieve game');
        return next()
      } else if (!model) {
        res.send(404, 'Could not find game with id ' + req.params.game);
        return next()
      }
      Models.Player.findOne({
        _id: req.params.player,
        game: req.params.game
      }, function(err, model) {
        if (err) {
          res.send(500, 'Could not retrieve player')
        } else {
          if (!model) {
            res.send(404, 'Could not find player with id ' + req.params.player);
          } else {
            res.send(Views.Player(model));
          }
        }
        return next();
      });
    })
  });
  server.post('/games/:game/players', function(req, res, next) {
    Models.Game.findOne({
      _id: req.params.game
    }, function(err, model) {
      if (err) {
        res.send(500, 'Could not retrieve game');
        return next()
      } else if (!model) {
        res.send(404, 'Could not find game with id ' + req.params.game);
        return next()
      }
      var credentials = req.body;
      Models.Player.createWithCredentials(credentials.username, credentials.password, req.params.game, function(err, model) {
        if (err === Models.Player.ERROR_USERNAME_TAKEN) {
          res.send(409, 'Username is already taken')
        } else if (err) {
          res.send(500, 'Internal server error')
        } else if (model) {
          res.send(200, Views.Player.authenticated(model))
        }
        return next();
      })
    });
  });
  // put for changing Player
  // delete for deleting player (soft or hard)
}