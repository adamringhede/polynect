var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  route.post('/v1/itemSpecs',
    $.restrict('developer admin'),
    $.require('game'),
    $.load({game: 'Game'}),
    function (req, res, next) {
      if (req.user.role !== 'admin' && req.user._id.toString() !== req.resources.game.developer.id.toString()) {
        next(new restify.errors.ForbiddenError('You are not authorized to access others\' accounts'));
      } else {
        next()
      }
    },
    $.create('itemSpec', 'ItemSpec', {
      developer: 'name holder product_id attributes data stackable', // holder can only be the developer or an organisation it belongs to
      admin: 'name holder game'
    }),
    $.output('itemSpec', Views.ItemSpec)
  );

  route.put('/v1/itemSpecs/:itemSpec',
    $.restrict('developer admin'),
    $.load({itemSpec: 'ItemSpec'}),
    restrictToDeveloperUnlessAdmin(),
    $.update('itemSpec', {
      developer: 'name matchmaking_config product_id attributes data stackable', // It should send 403 if trying to change another attribute
      admin: 'name holder matchmaking_config product_id attributes data stackable game'
    }),
    $.output('itemSpec', Views.ItemSpec)
  );

  route.get('/v1/itemSpecs/:itemSpec',
    $.restrict('developer admin player'),
    $.load({itemSpec: 'ItemSpec'}),
    restrictToDeveloperUnlessAdmin(),
    $.output('itemSpec', Views.ItemSpec)
  );

  route.get('/v1/itemSpecs',
    $.restrict('developer admin player'),
    $.loadList('itemSpecs', 'ItemSpec', function (req) {
      if (req.user.role == 'developer') {
        return {
          'game.developer.id': req.user._id
        }
      } else if (req.user.role == 'player') {
        return {
          game_id: req.user.game_id
        }
      }
    }),
    $.outputPage('itemSpecs', Views.ItemSpec)
  );

  route.del('/v1/itemSpecs/:itemSpec',
    $.restrict('developer admin'),
    $.load({itemSpec: 'ItemSpec'}),
    restrictToDeveloperUnlessAdmin(),
    $.delete('itemSpec', 'ItemSpec')
  );

}

function restrictToDeveloperUnlessAdmin() {
  return function (req, res, next) {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.resources.itemSpec.game.developer.id.toString()) {
      next(new restify.errors.ForbiddenError('You are not authorized to change others\' itemspecs'));
    } else {
      next()
    }
  }
}
