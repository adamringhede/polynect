var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var Builder = require('../../Components/MatchQueryBuilder/MatchQueryBuilder');
var Matchmaker = require('../../Components/Matchmaker/Matchmaker');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(server) {

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
            if (model.player.id.toString() === req.user._id.toString()) {
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

  // TODO if character is specified we dont need the player id
  server.post('/v1/matches',
    $.restrict('player'),
    function (req, res, next) {
      req.params.game = req.user.game.id;
      next();
    },
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
        }
        req.resources.match = match;
        return next();
      });
    },
    $.output('match', Views.Match)
  );

  server.get('/v1/matches/:match',
    $.restrict('admin player'),
    $.load({match: 'Match'}),
    function(req, res, next) {
      if (req.user.role === 'player') {
        var valid = false;
        for (var i = 0, l = req.resources.match.requests.length; i < l; i++) {
          if (req.resources.match.requests[i].player.id.toString() == req.user._id.toString()) valid = true;
        }
        if (valid) {
          next();
        } else {
          next(new restify.errors.ForbiddenError('The authorized player is not in the requested match'));
        }
      } else if (req.user.role === 'developer') {
        if (req.match.game.developer.id.toString() == req.user._id.toString()) {
          next();
        } else {
          next(new restify.errors.ForbiddenError('You are not the developer of the game this match belongs to'));
        }
      } else {
        next();
      }
    },
    $.output('match', Views.Match)
  );

  server.get('/v1/matches',
    $.restrict('admin player developer'),
    $.loadList('matches', 'Match'),
    $.outputPage('matches', Views.Match)
  );

}
