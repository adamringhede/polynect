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

  /**
   * Creates an item and sets it to the specified holder
   * @param  {String} holderKey A key to the resource that should be the holder of the item created
   * @return {[type]}
   */
  function createItem (holderKey) {
    return function (req, res, next) {
      if (!req.resources) req.resources = {};
      var holder = req.resources[holderKey || 'player'];
      Models.ItemSpec.findOne({_id: req.body.itemSpec, game: req.params.game}, function (err, spec) {
        if (err) next(err);
        else if (!spec) next(new restify.errors.NotFoundError('Could not find item spec with id ' + req.body.itemSpec + ' of game with id ' + req.params.game));
        else {
          var count = null;
          if (spec.stackable) {
            count = req.body.count || 0;
          }
          holder.addItem(spec, count, function (err, item) {
            req.resources.item = item;
            next(err);
          })
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
  route.post('/v1/itemSpecs/:item/buy',
    $.restrict('player'),
    $.load({itemSpec: 'ItemSpec'}),
    function (req, res, next) {
      var player = req.user
      var insufficient_funds = false;
      for (var i = 0, l = req.resources.item.cost.length; i < l; i++) {
        var cost = req.resources.item.cots[i];
        var player_amount = _.where(player.currencies, {id: cost.id,});
        if (!player_amount || player_amount - cost.amount < 0) {
          insufficient_funds = true;
          break; // insufficient funds
        } else {
          player.currencies[cost.currency] - cost.amount;
        }
      }
      if (insufficient_funds) {
        next(new restify.errors.BadRequestError('Insufficient funds'));
      } else {
        player.save(function (err, model) {
          if (err) next(err);
          next()
        })
      }
    },
    createItem(),
    $.output('item', Views.Item)
  );

//  route.post('/v1/items/:item/sell'); // Only if the item is owned by the player

  // Create
  route.post('/v1/games/:game/players/:player/items',
    $.restrict('admin player developer'),
    $.require('itemSpec'),
    $.load({game: 'Game', player: 'Account', character: 'Character'}),
    confirmReferences(),
    determineAccess(),
    createItem('player'),
    $.output('item', Views.Item)
  );
  route.post('/v1/games/:game/players/:player/characters/:character/items',
    $.restrict('admin player developer'),
    $.require('itemSpec'),
    $.load({game: 'Game', player: 'Account', character: 'Character'}),
    confirmReferences(),
    determineAccess(),
    createItem('character'),
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
    createItem('character'),
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
    createItem('player'),
    $.output('item', Views.Item)
  );

  // Get
  route.get('/v1/characters/:character/items',
    $.loadList('items', 'Item', function (req) {
      return {
        character: req.params.character
      }
    }),
    $.outputPage('items', Views.Item)
  );
  route.get('/v1/players/:player/items',
    $.loadList('items', 'Item', function (req) {
      return {
        player: req.params.player
      }
    }),
    $.outputPage('items', Views.Item)
  );
  route.get('/v1/items/:item',
    $.load({item: 'Item'}),
    $.output('item', Views.Item)
  );
  // List all items on Polynect
  route.get('/v1/items',
    $.restrict('admin'),
    $.loadList('items', 'Item'),
    $.outputPage('items', Views.Item)
  );

  function checkChangeAccess() {
    return function (req, res, next) {
      if (req.user.role == 'player' && req.user._id.toString() !== req.resources.player._id.toString()) {
        next(new restify.errors.ForbiddenError("You can not change another player's item"))
      } else if (req.user.role == 'developer') {
        // find out if developer has access to the game.
        req.user.hasAccessToGame(req.resources.player.game, function (hasAccess) {
          if (hasAccess) next();
          else next(new restify.errors.ForbiddenError("You do not have access to this player's items"))
        })
      } else next();
    };
  }
  // Update
  route.put('/v1/items/:item',
    $.load({item: 'Item'}),
    function (req, res, next) {
      req.params.player = req.resources.item.player.toString();
      next();
    },
    $.load({player: 'Account'}),
    checkChangeAccess(),
    $.update('item', {
      player: 'name data',
      developer: 'player character name data count',
      admin: 'player character name data count game itemSpec'
    }),
    $.output('item', Views.Item)
  );

  // Delete
  route.del('/v1/items/:item',
    $.load({item: 'Item'}),
    function (req, res, next) {
      req.params.player = req.resources.item.player.toString();
      next();
    },
    $.load({player: 'Account'}),
    checkChangeAccess(),
    $.delete('item', 'Item')
  );

}
