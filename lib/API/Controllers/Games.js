var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');

module.exports = function(route) {

  route.post('/games',
    $.restrict('developer admin'),
    function (req, res, next) {
      if (!req.body.holder) {
        req.body.holder = req.user._id;
      } else if (req.user.role !== 'admin') {
        if (req.body.holder != req.user._id) {
          // create error, failure and success methods on response o use instead that correctly formats the output for error messages
          res.send(403, "You are not allowed to set the holder to another account")
        }
      }
      next();
    },
    $.create('game', 'Game', {
      developer: 'name holder matchmaking_config', // holder can only be the developer or an organisation it belongs to
      admin: 'name holder matchmaking_config'
    }),
    $.output('game', Views.Game)
  );

  route.put('/games/:game',
    $.restrict('developer admin'),
    $.load({game: 'Game'}),
    $.update('game', {
      developer: 'name matchmaking_config', // It should send 403 if trying to change another attribute
      admin: 'name holder matchmaking_config'
    }),
    $.output('game', Views.Game)
  );

  route.get('/games/:game',
    $.restrict('developer admin player'),
    $.load({game: 'Game'}),
    $.output('game', Views.Game)
  );

  route.get('/games',
    $.restrict('developer admin'),
    $.loadList('games', 'Game', function (req) {
      if (req.user.role !== 'admin') {
        return {
          holder: req.user._id
        };
      }
    }),
    $.outputPage('games', Views.Game)
  );

}
