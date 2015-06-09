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

function findMatch(player_id, attempts, builder, callback, attempt) {
  if (!attempt) attempt = 1;
  builder.setAttempt(attempt)
  var query = builder.build();
  Models.Match.findOne(query, function handler(err, model) {
    if (err) callback(err, null);
    else {
      if (!model && attempt < attempts) {
        attempt++;
        findMatch(player_id, attempts, builder, callback, attempt);
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
          player, // Player
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
        findMatch(player._id, attempts, builder, function (err, match) {
          if (err) {
            console.error(err);
            res.send(500, 'Something went wrong');
            return next()
          }
          if (!match) {
            // Create a new match
            match = new Models.Match();
            match.requirements = game.matchmaking_config.attributes
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

  server.get('/games/:game/matches/:id', function(req, res, next) {
    // Chech the users authorization token
    // Get the match.
    // Check that the player is within it, if that it the case, return an authorized match view including the secret
    // Otherwise return a not so authorized view with just the id.
  });

}
