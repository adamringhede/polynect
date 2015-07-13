var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');



module.exports = function(route) {

  route.post('/games', function (req, res, next) {
    var game = new Models.Game();
    game.name = req.params.name;
    game.save(function (err, model) {
      if (!err) {
        res.send(200, Views.Game(model));
      } else {
        res.send(500, err);
      }
      return next();
    })
  });

}
