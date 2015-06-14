var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var Builder = require('../../Components/MatchQueryBuilder/MatchQueryBuilder');
var Matchmaker = require('../../Components/Matchmaker/Matchmaker');


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

  server.post('/games/:game/match', function(req, res, next) {
    getGame(req, res, next, function(game){
      getPlayer(req, res, next, function(player) {
        Matchmaker.findMatch({
          player: player,
          game: game,
          character: {},
          values: req.body.values
        }, function (err, match) {
          if (err) {
            res.send(err.code, {
              reason: result.message,
              data: result.data
            })
          } else if (match) {
            res.send(200, Views.Match(match));
          }
          return next();
        })
      });
    });
  });

  server.get('/games/:game/matches/:id', function(req, res, next) {
    // Chech the users authorization token
    // Get the match.
    // Check that the player is within it, if that it the case, return an authorized match view including the secret
    // Otherwise return a not so authorized view with just the id.
  });

}
