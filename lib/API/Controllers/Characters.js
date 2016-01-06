var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function (route) {

  function restrictPosting() {
    return function (req, res, next) {
      // check that the player is the authorised one
      if (req.user.role == 'admin') next();
      else if (req.user.role == 'player') {
        if (req.user._id.toString() === req.params.player) next()
        else next(new restify.errors.ForbiddenError("You are not authorized to create a character for this player"));
      } else if (req.user.role == 'developer') {
        // need to load the game and player to find the developer of it and make sure that the player belongs to that game
        $.load({player: 'Account'})(req, res, function (err) {
          if (err) next(err);
          else {
            var hasAccess = req.resources.player.game.developer.id.toString() === req.user._id.toString();
            if (hasAccess) next();
            else next(new restify.errors.ForbiddenError("You are not authorized to create a character for this player"));
          }
        });
      } else {
        next(new restify.errors.InternalServerError("A valid user role was not set"));
      }
    }
  }

  function setDefaults() {
    return function (req, res, next) { // Derive values (maybe send an error if trying to override the derived values)
      if (req.user.role == 'player') {
        req.body.player = req.params.player = req.user._id.toString()
        //req.body.game = req.params.game = req.user.game.id.toString()
      }
      next();
    };
  }
  function setDefaultsUpdate() {
    return function (req, res, next) { // Derive values (maybe send an error if trying to override the derived values)
      if (req.user.role == 'developer') {
        //req.body.game = req.params.game = req.resources.character.game.toString();
      }
      next();
    };
  }

  route.post('/v1/characters',
    setDefaults(),
    $.require('player'),
    restrictPosting(),
    $.create('character', 'Character', {
      player: 'player name data',
      developer: 'player name data',
      admin: 'player name data'
    }),
    $.output('character', Views.Character)
  );

  route.put('/v1/characters/:character',
    $.restrict('admin developer player'),
    $.load({character: 'Character'}),
    setDefaults(),
    setDefaultsUpdate(),
    restrictAccessForChanging("You are not authorized to change this character"),
    $.update('character', {
      player: 'name data',
      developer: 'player name data',
      admin: 'player name data game'
    }),
    $.output('character', Views.Character)
  );

  route.get('/v1/characters/',
    $.restrict('admin developer player'),
    $.loadList('characters', 'Character', function (req) {
      if (req.user.role == 'player') {
        return {
          game_id: req.user.game.id
        }
      } else if (req.user.role == 'developer') {
        return {
          "game.developer_id": req.user._id
        }
      }
    }),
    $.outputPage('characters', Views.Character)
  );

  route.get('/v1/games/:game/players/:player/characters/:character',
    $.restrict('admin developer player'),
    $.load({character: 'Character'}),
    $.output('character', Views.Character)
  );

  route.del('/v1/games/:game/players/:player/characters/:character',
    $.restrict('admin developer player'),
    $.load({character: 'Character'}),
    restrictAccessForChanging("You are not authorized to delete this character"),
    $.delete('character', 'Character')
  );

}

function restrictAccessForChanging (message) {
  return function (req, res, next) {

    var hasAccess = false;
    var userId = req.user._id.toString()
    if (req.user.role == 'admin') {
      next();
    } else if (req.user.role == 'player') {
      if (req.resources.character.player.id.toString() === req.user._id.toString()) {
        next();
      } else next(new restify.errors.ForbiddenError(message));
    } else { // role === 'developer'
      if (req.resources.character.player.game.developer.id.toString() === req.user._id.toString()) {
        next();
      } else next(new restify.errors.ForbiddenError(message));
    }
  }
}
