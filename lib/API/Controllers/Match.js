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
        } else {
          req.resources.match = match;
          return next();
        }
      });
    },
    $.publishTopic('match_updates', function (req) {
      return {
        key: 'matches.' + req.resources.match.game.id + '.' + req.resources.match._id + '.update',
        msg: Views.Match(req.resources.match, req)
      }
    }),
    $.output('match', Views.Match, ['teams'])
  );

  server.del('/v1/matches/:match',
    $.restrict('admin developer'),
    $.load({match: 'Match'}),
    $.forbid('developer', function (req) {
      return req.resources.match.game.developer.id.toString() != req.user._id.toString();
    }),
    $.delete('match', 'Match')
  );

  server.del('/v1/matches/:match/players/:player',
    $.restrict('admin developer player'),
    $.load({match: 'Match'}),
    function (req, res, next) {
      var removed = req.resources.match.removePlayer(req.params.player);
      if (removed) {
        req.resources.match.save();

        // TODO Execute match.close hooks if the match.size == 0

        next();
      } else {
        next(new restify.errors.ResourceNotFoundError('Could not find the specified player in this match'));
      }
    },
    $.publishTopic('match_updates', function (req) {
      return {
        key: 'matches.' + req.resources.match.game.id + '.' + req.resources.match._id + '.update',
        msg: Views.Match(req.resources.match, req)
      }
    }),
    $.output('match', Views.Match, ['teams'])
  );

  function formatRequest(params) {
    let player = new Models.Account();
    let character = new Models.Character();

    if (params.player.id != null) {
      player.player_id = params.player.id;
    }
    if (params.character && params.character.id != null) {
      character.character_id = params.character.id;
    }
    player.data = params.player;
    character.data = params.character;
    return {
      player: player,
      character: params.character != null ? character : {},
      values: params.options || params.values || {}
    }
  }

  server.post('/v1/matches/match',
    $.restrict('admin developer'),
    $.require('game'),
    $.load({game: 'Game'}),
    $.forbid('developer', function (req) {
      return req.resources.game.developer.id.toString() != req.user._id.toString();
    }),
    function (req, res, next) {
      function callback(err, match) {
        if (err) {
          res.send(err.code, {
            message: err.message,
            errors: err.data
          });
          return next();
        }
        req.resources.match = match;
        return next();
      }
      if (req.body.group) {
        let requests = req.body.group.map(formatRequest);
        Matchmaker.findMatchForGroup(requests, req.resources.game).then((match) => callback(null, match))
      } else {
        var matchRequest = formatRequest(req.body);
        matchRequest.game = req.resources.game;
        // This can be moved to a separate function as it should be the same for the other endpoint
        Matchmaker.findMatch(matchRequest, callback);
      }
    },
    (req, res, next) => {
      req.resources.match.populate('teams', next);
    },
    (req, res, next) => {
      const match = req.resources.match
      const payload = {
        match: Views.Match(req.resources.match, req)
      };
      if (match.status == Models.Match.STATUS_READY && !match.initiated) {
        // make an atomic find and update to update initiated
        Models.Match.findOneAndUpdate({_id: match._id}, {$set: {initiated: true}}, {'new': false})
          .then(old => {
            if (!old.initiated) {
              Models.Webhook.find({"game.id": req.resources.game.id})
                .then(hooks => Promise.all(hooks.map(hook => hook.send("match_init", payload))))
                .then(hooksResults => {
                  match.initiated = true
                  match.save()
                })
                .then(next)
            }
          })
      } else {
        next()
      }
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
    $.output('match', Views.Match, ['teams'])
  );

  server.post('/v1/matches/:match/players',
    $.restrict('admin developer'),
    $.require('player'),
    $.load({match: 'Match'}),
    $.forbid('developer', function (req) {
      return req.user._id.toString() != req.resources.match.game.developer.id
    }),
    (req, res, next) => {
      var builder = new Builder(
        req.resources.match.game.matchmaking_config,
        req.body.options || req.body.values, // Input values
        req.body.player, // Player
        req.body.character || null, // Character
        'attributes'
      );
      // TODO Check that the size does not exceed match.max
      if (builder.hasErrors()) {
        res.send(400, builder.getErrors());
      } else {
        req.resources.match.addRequest(builder.request, req.resources.match.game.matchmaking_config);
        req.resources.match.save(next)
      }
    },
    $.output('match', Views.Match, ['teams'])
  );

  server.put('/v1/matches/:match',
    $.restrict('admin developer'),
    $.load({match: 'Match'}),
    $.forbid('developer', function (req) {
      return req.user._id.toString() != req.resources.match.game.developer.id
    }),
    $.update('match', {
      developer: '+:data open',
      admin: '+:data open'
    }),
    $.publishTopic('match_updates', function (req) {
      return {
        key: 'matches.' + req.resources.match.game.id + '.' + req.resources.match._id + '.update',
        msg: Views.Match(req.resources.match, req)
      }
    }),
    $.output('match', Views.Match, ['teams'])
  );

  server.get('/v1/matches',
    $.restrict('admin player developer'),
    $.loadList('matches', 'Match', function (req) {
      if (req.user.role == 'developer') {
        return {
          'game.developer.id': req.user._id
        };
      }
    }, ['teams']),
    $.outputPage('matches', Views.Match)
  );

};
