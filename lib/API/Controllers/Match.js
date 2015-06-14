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

function getMatch(req, res, next, callback) {
  Models.Match.findOne({
    _id: req.params.match
  }, function(err, match) {
    if (err) {
      res.send(500, 'Could not retrieve match');
      next()
    } else if (!match) {
      res.send(404, 'Could not find match with id ' + req.params.match);
      next()
    } else {
      callback(match);
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

  server.get('/games/:game/matches/:match', function(req, res, next) {
    getPlayer(req, res, next, function(player) {
      getMatch(req, res, next, function(match) {
        var valid = false;
        for (var i = 0, l = match.requests.length; i < l; i++) {
          if (match.requests[i].player.id == player._id.toString()) valid = true;
        }
        if (valid) {
          res.send(200, Views.Match(match));
        } else {
          res.send(403, 'The authorized player is not in the requested match');
        }

        return next();
      });
    });
  });

}
