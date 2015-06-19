var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');

function getGame(req, res, next, callback) {
  Models.Game.findOne({
    _id: req.params.game
  }, function(err, game) {
    if (err) {
      res.send(500, 'Could not retrieve game');
      next()
    } else if (!game) {
      res.send(404, 'Could not find game with id ' + req.params.game);
      next()
    } else {
      callback(game);
    }
  });
}

function getPlayer(req, res, next, callback) {
  Models.Player.findWithToken(req.query.access_token, function(err, player) {
    if (err) {
      if(err == Models.Player.ERROR_TOKEN_INVALID) {
        res.send(401, 'Invalid token');
      } else {
        res.send(500, 'Could not retrieve player');
      }
      next()
    } else if (!player) {
      res.send(404, 'Could not find player with access_toke');
      next()
    } else {
      callback(player);
    }
  });
}


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
  server.put('/games/:game/players/:player/data', function (req, res, next) {

    getGame(req, res, next, function(game){
      getPlayer(req, res, next, function(player) {
        var actions = req.body.actions;
        if (!actions instanceof Array || actions.length === 0) {
          res.send(400, 'Body needs to contain an action attribute with an array of actions');
          return next();
        }
        for (var i = 0, l = actions.length; i < l; i++) {
          var action = actions[i];
          action.do = action.do.toLowerCase();
          if (typeof action.at !== 'string') {
            res.send(400, 'The path (at) needs to a specified as a string using dot notation');
            return next();
          }
          switch (action.do) {
            case 'set': player.set('data.' + action.at, action.v); break;
            case 'push': player.push('data.' + action.at, action.v); break;
            case 'empty': player.empty('data.' + action.at); break;
            case 'insert': player.insert('data.' + action.at, action.v, typeof action.i == 'number' ? action.i : 0); break;
            default:
              res.send(400, 'The specified method (do) "' + action.do + '" is not valid');
              return next();
          }
          player.save(function () {
            res.send(Views.Player(player));
          })
        }
      });
    });
  });
  // delete for deleting player (soft or hard)
}
