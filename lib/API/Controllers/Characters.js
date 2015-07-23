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
        $.load({game: 'Game', player: 'Account'})(req, res, function (err) {
          if (err) next(err);
          else {
            var hasAccess = req.resources.game.holder.toString() === req.user._id.toString() &&
              req.resources.player.game.toString() === req.resources.game._id.toString()
            if (hasAccess) next();
            else next(new restify.errors.ForbiddenError("You are not authorized to create a character for this player"));
          }
        });
      } else {
        console.log(req.user)
        next(new restify.errors.InternalServerError("A valid user role was not set"));
      }
    }
  }

  route.post('/v1/games/:game/players/:player/characters/',
    $.restrict('admin developer player'),
    restrictPosting(),
    function (req, res, next) { // Derive values (maybe send an error if trying to override the derived values)
      if (req.user.role == 'player') {
        req.body.player = req.user._id
        req.body.game = req.user.game
      }
      next();
    },
    $.require('game player'),
    $.create('character', 'Character', {
      player: 'name data player game',
      developer: 'player name data game',
      admin: 'player name data game'
    }),
    $.output('character', Views.Character)
  );

  route.post('/v1/characters',
    function (req, res, next) { // Derive values (maybe send an error if trying to override the derived values)
      if (req.user.role == 'player') {
        req.body.player = req.params.player = req.user._id.toString()
        req.body.game = req.params.game = req.user.game.toString()
      }
      next();
    },
    $.require('game player'),
    restrictPosting(),
    $.create('character', 'Character', {
      player: 'name data player game',
      developer: 'player name data game',
      admin: 'player name data game'
    }),
    $.output('character', Views.Character)
  );

  route.put('/v1/games/:game/players/:player/characters/:character',
    $.restrict('admin developer player'),
    $.load({character: 'Character'}),
    restrictAccessForChanging("You are not authorized to change this character"),
    $.update('character', {
      player: 'name data',
      developer: 'player name data',
      admin: 'player name data game'
    }),
    $.output('character', Views.Character)
  );

  route.get('/v1/games/:game/players/:player/characters/',
    $.restrict('admin developer player'),
    $.loadList('characters', 'Character', function (req) {
      return {
        player: req.params.player
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
      if (req.user._id.toString() === req.params.player &&
         req.resources.character.player.toString() === req.user._id.toString()) {
        next();
      } else next(new restify.errors.ForbiddenError(message));
    } else { // role === 'developer'
      $.load({game: 'Game'})(req, res, function (err) {
        if (err) next(err);
        else {
          hasAccess = req.resources.game.holder.toString() === req.user._id.toString() &&
            req.resources.character.game.toString() === req.resources.game._id.toString()
          if (hasAccess) next();
          else next(new restify.errors.ForbiddenError(message));
        }
      });
    }
  }
}
