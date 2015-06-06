var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var Builder = require('../../Components/MatchQueryBuilder/MatchQueryBuilder');


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
  Models.Player.findOne({
    _id: req.body.player
  }, function(err, player) {
    if (err) {
      res.send(500, 'Could not retrieve player');
      next()
    } else if (!player) {
      res.send(404, 'Could not find player with id ' + req.body.player);
      next()
    } else {
      callback(player);
    }
  });
}

function findMatch(attempt, attempts, builder, callback) {
  builder.setAttempt(attempt)
  var query = builder.build();
  Models.Match.findOne(query, function handler(err, model) {
    if (err) callback(err, null);
    else {
      if (!model && attempt < attempts) {
        attempt++;
        findMatch(attempt, attempts, builder, callback);
      } else {
        callback(null, model); // This will model as null if one cannot be found after all attempts
      }
    }
  });
}

module.exports = function(server) {

  server.post('/games/:game/match', function(req, res, next) {
    getGame(req, res, next, function(game){
      getPlayer(req, res, next, function(player) {
        var attempts = game.matchmaking_config.attempts;
        var builder = new Builder(
          game.matchmaking_config,
          req.body.values, // Input values
          player.data, // Player
          {}, // Character
          'attributes'
        );
        if (builder.hasErrors()) {
          res.send(400, {
            reason: 'Could not create a matchmaking request',
            errors: builder.getErrors()
          });
          return next();
        }
        findMatch(1, attempts, builder, function (err, match) {
          if (err) {
            console.error(err);
            res.send(500, 'Something went wrong');
            return next()
          }
          if (!match) {
            // Create a new match
            match = new Models.Match();
          }
          match.addRequest(builder.request);
          match.save(function (err) {
            res.send(200, Views.Match(match));
            return next();
          });
        });
      });
    });
  });

}
