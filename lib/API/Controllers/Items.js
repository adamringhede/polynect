var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  function determineAccess () {
    return function (req, res, next) {
      if (req.user.role === 'developer') {
        if (req.resources.game.developer.id.toString() !== req.user._id.toString()) {
          next(new restify.errors.ForbiddenError("You are not authorized to create an item for this player."));
        } else next();
      } else if (req.user.role === 'player') {
        if (req.user._id.toString() !== req.params.player.toString()) {
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
      if (req.resources.character != null) {
        var holder = req.resources.character;
      } else {
        var holder = req.resources.player;
      }
      Models.ItemSpec.findOne({_id: req.body.item_spec, game_id: req.resources.player.game.id}, function (err, spec) {
        if (err) next(err);
        else if (!spec) next(new restify.errors.NotFoundError('Could not find item spec with id ' + req.body.item_spec + ' of game with id ' + req.params.game));
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
  route.post('/v1/items',
    $.restrict('admin player developer'),
    function (req, res, next) {
      if (req.user.role == 'player') {
        // TODO, don't use params, use body insted
        req.params.player = req.user._id
      }
      next();
    },
    $.require('item_spec', 'player'),
    $.load({player: 'Account', character: 'Character'}),
    function (req, res, next) {
      if (req.user.role === 'developer' && req.resources.player.game.developer.id.toString() !== req.user._id.toString()) {
        next(new restify.errors.ForbiddenError("You are not authorized to create an item for this player."));
      } else next();
    },
    //confirmReferences(),
    //determineAccess(),
    createItem('player'),
    $.output('item', Views.Item)
  );/*
  route.post('/v1/items',
    $.restrict('admin player developer'),
    $.require('item_spec'),
    $.load({game: 'Game', player: 'Account', character: 'Character'}),
    confirmReferences(),
    determineAccess(),
    createItem('character'),
    $.output('item', Views.Item)
  );*/
  /*
  // Shallow POST paths
  route.post('/v1/items',
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
  route.post('/v1/items',
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
  );*/

  // Get
  route.get('/v1/items',
    $.loadList('items', 'Item', function (req) {
      if (req.user.role == 'player') {
        return {
          'player.game.id': req.user.game.id
        }
      } else if (req.user.role == 'developer') {
        return {
          'player.game.developer.id': req.user._id
        }
      }
    }),
    $.outputPage('items', Views.Item)
  );
  route.get('/v1/items/:item',
    $.load({item: 'Item'}),
    $.output('item', Views.Item)
  );

  function checkChangeAccess() {
    return function (req, res, next) {
      if (req.user.role == 'player' && req.user._id.toString() !== req.resources.item.player.id.toString()) {
        next(new restify.errors.ForbiddenError("You can not change another player's item"))
      } else if (req.user.role == 'developer' && req.user._id.toString() !== req.resources.item.player.game.developer.id.toString()) {
        next(new restify.errors.ForbiddenError("You do not have access to this player's items"))
      } else next();
    };
  }
  // Update
  route.put('/v1/items/:item',
    $.load({item: 'Item'}),
    checkChangeAccess(),
    $.update('item', {
      player: 'data', // Changing character is not allowed to prevent cheating
      developer: 'player character data count',
      admin: 'player character data count game itemSpec'
    }),
    $.output('item', Views.Item)
  );

  // Delete
  route.del('/v1/items/:item',
    $.load({item: 'Item'}),
    function (req, res, next) {
      req.params.player = req.resources.item.player.id.toString();
      next();
    },
    $.load({player: 'Account'}),
    checkChangeAccess(),
    $.delete('item', 'Item')
  );

}
