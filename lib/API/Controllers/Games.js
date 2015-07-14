var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');

module.exports = function(route) {

  route.post('/games', $.restrict('developer admin'), function (req, res, next) {

    var game = new Models.Game();
    game.name = req.body.name;
    game.save(function (err, model) {
      if (!err) {
        res.send(200, Views.Game(model));
      } else {
        res.send(500, err);
      }
      return next();
    })
  });

/*  route.put('/games/:game', restrict('developer admin'), load({game: 'Game'}), put('Game', 'game' { // model and param
    developer: 'name matchmaking_config', // It should send 403 if trying to change another attribute
    admin: 'name holder matchmaking_config'
  }));
*/
  route.get('/games/:game',
    $.restrict('developer admin player'),
    $.load({game: 'Game'}),
    $.output('game', Views.Game)
  );

}
