var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  route.post('/v1/games',
    $.restrict('developer admin'),
    function (req, res, next) {
      if (!req.body.developer) {
        req.body.developer = req.user._id;
        next();
      } else if (req.user.role !== 'admin' && req.body.developer != req.user._id) {
        next(new restify.errors.ForbiddenError("You are not allowed to set the developer to another account than your own"));
      } else {
        next();
      }
    },
    $.create('game', 'Game', {
      developer: 'name developer matchmaking_config', // developer can only be the developer or an organisation it belongs to
      admin: 'name developer matchmaking_config'
    }),
    $.output('game', Views.Game)
  );

  route.put('/v1/games/:game',
    $.restrict('developer admin'),
    $.load({game: 'Game'}),
    restrictToSelfUnlessAdmin(),
    $.update('game', {
      developer: 'name matchmaking_config playfab',
      admin: 'name developer matchmaking_config rate_limit playfab'
    }),
    $.output('game', Views.Game)
  );

  route.get('/v1/games/:game',
    $.restrict('developer admin player'),
    $.load({game: 'Game'}),
    $.output('game', Views.Game)
  );

  route.get('/v1/games',
    $.restrict('developer admin'),
    $.loadList('games', 'Game', function (req) {
      if (req.user.role !== 'admin') {
        return {
          'developer.id': req.user._id
        };
      }
    }),
    $.outputPage('games', Views.Game)
  );

  route.del('/v1/games/:game',
    $.restrict('developer admin'),
    $.load({game: 'Game'}),
    restrictToSelfUnlessAdmin(),
    $.delete('game', 'Game')
  );

}

function restrictToSelfUnlessAdmin() {
  return function (req, res, next) {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.resources.game.developer.id.toString()) {
      next(new restify.errors.ForbiddenError('You are not authorized to access other developers\' games'));
    } else {
      next()
    }
  }
}
