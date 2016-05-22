var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var Builder = require('../../Components/MatchQueryBuilder/MatchQueryBuilder');
var Matchmaker = require('../../Components/Matchmaker/Matchmaker');
var $ = require('../Helpers/Tools');
var restify = require('restify');


module.exports = function(server) {

  function isCharacterNeeded (game) {
    for (var key in game.matchmaking_config.attributes) {
      var attr = game.matchmaking_config.attributes[key];
      if (/^character\./i.test(attr.value)) {
        return true;
      }
    }
    return false;
  }

  function isPlayerNeeded (game) {
    for (var key in game.matchmaking_config.attributes) {
      var attr = game.matchmaking_config.attributes[key];
      if (/^player\./i.test(attr.value)) {
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
        values: req.body.values || req.body.options || {}
      }, function (err, match) {
        if (err) {
          res.send(err.code, {
            reason: err.message,
            data: err.data
          })
          return next();
        }/*
        var ex = 'match_updates';
        var key = 'matches.' + match.game.id + '.' + match._id + '.update';
        var msg = Views.Match(match);
        setTimeout(function () {
          ch.publish(ex, key, new Buffer(JSON.stringify(msg)));
          console.log("Sent %s:'%s'", key, msg);
        }, 0);*/
        
        req.resources.match = match;
        return next();
      });
    },
    //$.publishTopic('match_updates', 'matches.$(resources.match.game.id).$(resources.match.id).update', 'match', Views.Match),
    $.publishTopic('match_updates', function (req) {
      return {
        key: 'matches.' + req.resources.match.game.id + '.' + req.resources.match._id + '.update',
        msg: Views.Match(req.resources.match, req)
      }
    }),
    $.output('match', Views.Match)
  );

  server.del('/v1/matches/:match',
    $.restrict('admin developer'),
    $.load({match: 'Match'}),
    $.forbid('developer', function (req) {
      return req.resources.match.game.developer.id.toString() != req.user._id.toString();
    }),
    $.delete('match', 'Match')
  );

  server.post('/v1/matchmaker',
    $.restrict('admin developer'),
    $.require('game'),
    $.load({game: 'Game'}),
    $.forbid('developer', function (req) {
      return req.resources.game.developer.id.toString() != req.user._id.toString();
    }),
    function (req, res, next) {
      var player = new Models.Account();
      var character = new Models.Character();

      if (req.body.player.id != null) {
        player.player_id = req.body.player.id;
      }
      if (req.body.character && req.body.character.id != null) {
        character.character_id = req.body.character.id;
      }

      player.data = req.body.player;
      character.data = req.body.character;

      // This can be moved to a separate function as it should be the same for the other endpoint
      Matchmaker.findMatch({
        player: player,
        game: req.resources.game,
        character: req.body.character != null ? character : {},
        values: req.body.options || req.body.values || {}
      }, function (err, match) {
        if (err) {
          res.send(err.code, {
            message: result.message,
            errors: result.data
          })
          return next();
        }
        req.resources.match = match;
        return next();
      });
    },
    $.publishTopic('match_updates', function (req) {
      return {
        key: 'matches.' + req.resources.match.game.id + '.' + req.resources.match._id + '.update',
        msg: Views.Match(req.resources.match, req)
      }
    }),
    $.output('match', Views.Match)
  );

  server.get('/v1/matches/:match',
    $.restrict('admin developer player'),
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
        if (req.resources.match.game.developer.id.toString() == req.user._id.toString()) {
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
    $.loadList('matches', 'Match', function (req) {
      if (req.user.role == 'developer') {
        return {
          'game.developer.id': req.user._id
        };
      }
    }),
    $.outputPage('matches', Views.Match)
  );

}
