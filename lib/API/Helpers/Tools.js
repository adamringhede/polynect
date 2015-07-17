var mongoose = require('mongoose');
var async = require('async');
var restify = require('restify');
var Models = require('../../Models');
var OAuth = require('../OAuth');
var moment = require('moment');

var API_LIST_LIMIT = 10;

exports.restrict = function (roles) {
  return function (req, res, next) {
    if (roles.indexOf(req.user.role) < 0) {
      next(new restify.errors.NotAuthorizedError("The role '" + req.user.role + "' does not have access to this endpoint"));
    } else {
      next();
    }
  }
}

exports.output = function (resource, view) {
  return function (req, res, next) {
    res.success(200, view(req.resources[resource], req));
    return next();
  }
}

exports.create = function (param, type, permissions, defaults) {
  return function (req, res, next) {
    if (req.user) {
      var role = req.user.role;
    } else {
      var role = '_';
    }
    var model = new (mongoose.model(type))();
    var allowed = permissions[role].split(' ');
    for (key in req.body) {
      if (allowed.indexOf(key) >= 0) {
        model[key] = req.body[key];
      }
    }
    for (key in defaults) {
      if (!req.body.hasOwnProperty(key) || req.body[key] == null) model[key] = defaults[key];
    }
    if (!req.resources) req.resources = {};
    model.save(function (err, model) {
      if (err) {
        next(err);
      } else {
        req.resources[param] = model;
        next();
      }
    });
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
        next(err);
      } else {
        req.resources[param] = model;
        next();
      }
    });
  }
}

exports.default = function (defaults) {
  return function (req, res, next) {
    for (key in defaults) {
      if (!req.body[key]) req.body[key] = defaults[key];
    }
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
          next(new restify.errors.ResourceNotFoundError('Could not find ' + err));
        } else {
          next(err)
        }
      }
      next();
    });
  }
}

exports.createAccessToken = function (param) {
  return function (req, res, next) {
    var account = req.resources[param];
    OAuth.generateToken('accessToken', req, function (err, access_token) {
      if (err) throw err;
      OAuth.saveAccessToken(access_token, Models.Client.DEV_PORTAL, moment().add(1, 'month'), account, function (err, token) {
        if (err) throw err;
        req.oauth = token;
        next();
      });
    });
  }
}

exports.require = function (required_fields) {
  return function (req, res, next) {
    var fields = required_fields.split(' ');
    var missing = [];
    for (var i = 0, l = fields.length; i < l; i++) {
      if (!req.body.hasOwnProperty(fields[i])) {
        missing.push(fields[i]);
      }
    }
    if (missing.length > 0) {
      next(new restify.errors.MissingParameterError('Missing ' + missing.join(', ')));
    } else {
      next();
    }
  }
}

exports.delete = function (param, type) {
  return function (req, res, next) {

    mongoose.model(type).find({ _id: req.params[param] }).remove(function (err) {
      if (err) throw err
      else {
        res.success(200, 'Deleted ' + type.toLowerCase());
      }
      next();
    });
  }
}
