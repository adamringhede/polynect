var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');

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
  // find the player with the provided id. if it can not be found,
  // then send 404. if the player's id is the same one as the players then we
  // have we have player access to the object.
  // if the player's game is a game that belongs to any of the developer's
  // organisations, then we have developer access to the player.
  // this is a costly operation to check though, so maybe we should skip this,

  if (req.params.player == req.user._id.toString()) {
    if (req.user.game.toString() != req.params.game) {
      res.send(404, 'Could not find player');
      next();
    } else {
      callback(req.user);
    }
  } else if (req.user.role == 'admin') {
    // Retrieve player object
    Models.Account.findOne({_id: req.params.player, role: 'player', game: req.params.game}, function (err, player) {
      if (err) {
        res.send(500, 'Could not retrieve player');
        next();
      } else if (!player) {
        res.send(404, 'Could not find player');
        next();
      } else {
        callback(player);
      }
    });
  } else {
    res.send(404, 'Could not find player');
    next();
  }
}

module.exports = function(server) {

  server.get('/v1/games/:game/players/:player',
    $.restrict('player admin'),
    $.load({ game: 'Game', player: 'Account' }),
    $.output('player', Views.Player)
  );

  server.post('/v1/games/:game/players',
    $.require('username password'),
    $.load({game: 'Game'}),
    $.create('player', 'Account', {
      _: 'firstname lastname username password email game',
      developer: 'firstname lastname username password email game',
      admin: 'firstname lastname username password email game'
    }, {
      role: 'player'
    }),
    $.createAccessToken('player', Models.Client.BASE_CLIENT_GAMES),
    $.output('player', Views.Player.withToken)
  );
  server.put('/v1/games/:game/players/:player/data', function (req, res, next) {

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
