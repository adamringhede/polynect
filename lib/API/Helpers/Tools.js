var mongoose = require('mongoose');
var async = require('async');

exports.restrict = function (roles) {
  return function (req, res, next) {
    if (roles.indexOf(req.user.role) < 0) {
      res.send(403, "The role `" + req.user.role + "` does not have access to this endpoint");
    }
    next();
  }
}

exports.output = function (resource, view) {
  return function (req, res, next) {
    res.send(200, view(req.resources[resource]));
    return next();
  }
}

exports.load = function (types) {
  return function (req, res, next) {
    if (!req.resources) req.resources = {};
    async.forEachOf(types, function (type, param, callback) {
      mongoose.model(type).findOne({_id: req.params[param]}, function (err, model) {
        if (err) callback(err)
        else if (!model) callback(type)
        else
          req.resources[param] = model;
          callback()
      });
    }, function (err) {
      if (err) {
        if (typeof err === 'string') {
          res.send(404, 'Could not find ' + err)
        } else {
          res.send(500)
        }
      }
      next();
    });
  }
}
