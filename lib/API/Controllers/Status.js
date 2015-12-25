var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  route.get('/v1/status',
    function (req, res, next) {
      if (req.user != null) {
        var status = {
          authenticated: true,
          role: req.user.role,
          token_expires: req.oauth.bearerToken.expires
        };
      } else {
        var status = {
          authenticated: false
        }
      }
      res.success(200, status);
      return next();
    }
  );

}
