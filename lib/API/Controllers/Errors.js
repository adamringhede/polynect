var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');

module.exports = function(route) {

  route.get('/errors/internal', function (req, res, next) {
      "not a function"();
  });


}
