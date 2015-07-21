var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  function determineAccess () {
    return function (req, res, next) {
      if (req.user.role === 'developer') {
        if (req.resources.game.holder.toString() !== req.user._id.toString()) {
          next(new restify.errors.ForbiddenError("You are not authorized to create an item for this player."));
        } else next();
      } else if (req.user.role === 'player') {
        if (req.user._id.toString() !== req.params.player) {
          next(new restify.errors.ForbiddenError("You are not authorized to create an item for this player."));
        } else next()
      } else next();
    }
  }

  function createItem () {
    return function (req, res, next) {
      if (!req.resources) req.resources = {};
      Models.ItemSpec.findOne({_id: req.body.itemSpec, game: req.params.game}, function (err, spec) {
        if (err) next(err);
        else if (!spec) next(new restify.errors.NotFoundError('Could not find item spec with id ' + req.body.itemSpec + ' of game with id ' + req.params.game));
        else {
          // Create a new if it is not stackable and no item exists with this spec
          if (spec.stackable) {
            // Try to find an item of spec
            Models.Item.findOne({itemSpec: spec._id, game: req.params.game, player: req.params.player, character: req.params.character}, function (err, item) {
              if (err) return next(err);
              if (!item) {
                item = spec.getCopy();
                item.player = req.params.player;
                if (req.body.character) {
                  item.character = req.body.character;
                }
              }
              item.count += req.body.count || 1;
              item.save(function (err, item) {
                if (err) return next(err);
                req.resources.item = item;
                next();
              });
            });
          } else {
            var item = spec.getCopy();
            item.player = req.params.player;
            if (req.body.character) {
              item.character = req.body.character;
            }
            item.save(function (err, itemModel) {
              if (err) next(err);
              else {
                req.resources.item = item;
                next();
              }
            });
          }
        }
      });
    }
  }

  function confirmReferences () {
    return function (req, res, next) {
      if (req.resources.player.game.toString() !== req.params.game) {
        next(new restify.errors.BadRequestError("Player does not belong to game"));
      } else if (req.resources.character && req.resources.character.player.toString() !== req.params.player) {
        next(new restify.errors.BadRequestError("Character does not belong to player"));
      } else {
        next();
      }
    }
  }

  // Add to player
  route.post('/v1/games/:game/players/:player/items',
    $.restrict('admin player developer'),
    $.require('itemSpec'),
    $.load({game: 'Game', player: 'Account', character: 'Character'}),
    confirmReferences(),
    determineAccess(),
    createItem(),
    $.output('item', Views.Item)
  );

  // add to character
  route.post('/v1/games/:game/players/:player/characters/:character/items',
    $.restrict('admin player developer'),
    $.require('itemSpec'),
    $.load({game: 'Game', player: 'Account', character: 'Character'}),
    confirmReferences(),
    determineAccess(),
    createItem(),
    $.output('item', Views.Item)
  );
  // Shallow POST paths
  route.post('/v1/characters/:character/items',
    $.load({character: 'Character'}),
    function (req, res, next) {
      req.params.game = req.resources.character.game.toString();
      req.params.player = req.resources.character.player.toString();
      next();
    },
    $.load({game: 'Game', player: 'Account'}),
    confirmReferences(),
    determineAccess(),
    createItem(),
    $.output('item', Views.Item)
  );
  route.post('/v1/players/:player/items',
    $.load({player: 'Account'}),
    function (req, res, next) {
      req.params.game = req.resources.player.game.toString();
      next();
    },
    $.load({game: 'Game'}),
    confirmReferences(),
    determineAccess(),
    createItem(),
    $.output('item', Views.Item)
  );

}
