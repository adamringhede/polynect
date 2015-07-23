var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  route.post('/v1/games/:game/itemSpecs',
    $.restrict('developer admin'),
    $.load({game: 'Game'}),
    restrictToDeveloperUnlessAdmin(),
    $.create('itemSpec', 'ItemSpec', {
      developer: 'name holder matchmaking_config product_id attributes data stackable', // holder can only be the developer or an organisation it belongs to
      admin: 'name holder matchmaking_config game'
    }),
    $.output('itemSpec', Views.ItemSpec)
  );

  route.put('/v1/games/:game/itemSpecs/:itemSpec',
    $.restrict('developer admin'),
    $.load({itemSpec: 'ItemSpec'}),
    function (req, res, next) {
      req.params.game = req.body.game = req.resources.itemSpec.game.toString();
      next();
    },
    $.load({game: 'Game'}),
    restrictToDeveloperUnlessAdmin(),
    $.update('itemSpec', {
      developer: 'name matchmaking_config product_id attributes data stackable', // It should send 403 if trying to change another attribute
      admin: 'name holder matchmaking_config product_id attributes data stackable game'
    }),
    $.output('itemSpec', Views.ItemSpec)
  );

  route.get('/v1/games/:game/itemSpecs/:itemSpec',
    $.restrict('developer admin player'),
    $.load({itemSpec: 'ItemSpec'}),
    $.output('itemSpec', Views.ItemSpec)
  );

  route.get('/v1/games/:game/itemSpecs',
    $.restrict('developer admin player'),
    $.loadList('itemSpecs', 'ItemSpec', function (req) {
      return {
        game: req.params.game
      }
    }),
    $.outputPage('itemSpecs', Views.ItemSpec)
  );

  route.del('/v1/games/:game/itemSpecs/:itemSpec',
    $.restrict('developer admin'),
    $.load({itemSpec: 'ItemSpec'}),
    function (req, res, next) {
      req.params.game = req.body.game = req.resources.itemSpec.game.toString();
      next();
    },
    $.load({game: 'Game'}),
    restrictToDeveloperUnlessAdmin(),
    $.delete('itemSpec', 'ItemSpec')
  );

}

function restrictToDeveloperUnlessAdmin() {
  return function (req, res, next) {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.resources.game.holder.toString()) {
      next(new restify.errors.ForbiddenError('You are not authorized to access others\' accounts'));
    } else {
      next()
    }
  }
}
