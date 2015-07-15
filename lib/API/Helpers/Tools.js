var mongoose = require('mongoose');
var async = require('async');

var API_LIST_LIMIT = 10;

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
    res.send(200, {
      status: 'success',
      data: view(req.resources[resource])
    });
    return next();
  }
}

exports.update = function (param, permissions) {
  return function (req, res, next) {
    var model = req.resources[param];
    var allowed = permissions[req.user.role].split(' ');
    // TODO find changed attributes and send 403 if not allowed to set it
    for (key in req.body) {
      if (allowed.indexOf(key) >= 0) {
        model[key] = req.body[key];
      }
    }
    model.save(function (err, model) {
      if (err) {
        res.send(500, 'Something went wrong'); // Handle validation errors here
      } else {
        req.resources[param] = model;
      }
      next();
    });
  }
}

exports.outputPage = function (resource, view) {
  return function (req, res, next) {
    var models = req.resources[resource];
    var views = [];
    for (var i = 0, l = models.length; i < l; i++) {
      views.push(view(models[i]));
    }
    res.send(200, {
      status: 'success',
      count: models.count,
      limit: req.query.limit, // if one is not set by the client, then it is set using a default for the endpoint
      skip: req.query.skip,
      data: views
    });
    return next();
  }
}

exports.loadList = function (param, type, query) {
  return function (req, res, next) {
    if (!req.resources) req.resources = {};
    // Set defaults
    if (!req.query.skip) {
      req.query.skip = 0;
    }req.query.limit = API_LIST_LIMIT;
    if (!req.query.limit) {
      req.query.limit = API_LIST_LIMIT;
    }
    var conditions = query;
    if (typeof query == 'function') {
      conditions = query(req);
    }
    mongoose.model(type).count(conditions, function (err, count) {
      if (count == 0) {
        req.resources[param] = [];
        req.resources[param].count = count;
        next();
      } else {
        mongoose.model(type).find(conditions, function (err, models) {
          req.resources[param] = models;
          req.resources[param].count = count;
          next();
        }).limit(req.query.limit).skip(req.query.skip)
      }
    })

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
