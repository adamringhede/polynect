var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var Builder = require('../../Components/MatchQueryBuilder/MatchQueryBuilder');
var Matchmaker = require('../../Components/Matchmaker/Matchmaker');
var $ = require('../Helpers/Tools');
var restify = require('restify');


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
  if (req.user.role == 'player') {
    callback(req.user);
  } else {
    res.send(403);
    return next();
  }
}


module.exports = function(server) {
/*
  server.post('/v1/games/:game/matches', function(req, res, next) {
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
  });*/

  function isCharacterNeeded (game) {
    for (key in game.matchmaking_config.attributes) {
      var attr = game.matchmaking_config.attributes[key];
      if (/^character\./i.test(attr.value)) {
        return true;
      }
    }
    return false;
  }

  function loadCharacter (req, res, next) {
    if (isCharacterNeeded(req.resources.game)) {
      if (req.body.character) {
        Models.Character.findOne({_id: req.body.character}, function (err, model) {
          if (model) {
            if (model.player.toString() === req.user._id.toString()) {
              req.resources.character = model;
              next();
            } else {
              next(new restify.errors.ForbiddenError("The character has to belong to the player"));
            }
          } else if (model == null) {
            next(new restify.errors.NotFoundError("Could not find character"));
          } else {
            next(new restify.errors.InternalServerError("Could not retrieve character"));
          }
        })
      } else {
        next(new restify.errors.BadRequestError("A character id needs to be specified in the body"));
      }
    }
  }

  server.post('/v1/games/:game/matches',
    $.restrict('player'),
    $.load({game: 'Game'}),
    loadCharacter,
    function (req, res, next) {
      Matchmaker.findMatch({
        player: req.user,
        game: req.resources.game,
        character: req.resources.character || {},
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
      });
    }
  );

  server.get('/v1/games/:game/matches/:match', function(req, res, next) {
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
