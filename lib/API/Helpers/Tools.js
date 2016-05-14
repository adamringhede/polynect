var mongoose = require('mongoose');
var async = require('async');
var restify = require('restify');
var Models = require('../../Models');
var OAuth = require('../OAuth');
var moment = require('moment');
var jade = require('jade');
var sendgrid = require('sendgrid')(process.env['SENDGRID_USERNAME'], process.env['SENDGRID_PASSWORD']);
var Templates = require('../../Templates');

var API_LIST_LIMIT = 10;

function hasRedundancyPlugin(model) {
  return model.schema.methods.hasOwnProperty('update');
}

exports.restrict = function (roles) {
  return function (req, res, next) {
    if (roles.indexOf(req.user.role) < 0) {
      next(new restify.errors.NotAuthorizedError("The role '" + req.user.role + "' does not have access to this endpoint"));
    } else {
      next();
    }
  }
}

exports.forbid = function (roles, fn) {
  return function (req, res, next) {
    if (roles.indexOf(req.user.role) >= 0 && fn(req) == true) {
      next(new restify.errors.NotAuthorizedError());
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
        var value = typeof req.body[key] == 'string' ? req.body[key].trim() : req.body[key];
        if (hasRedundancyPlugin(model)) {
          model.update(key, value);
        } else {
          model[key] = value;
        }
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
    if (req.user) {
      var role = req.user.role;
    } else {
      var role = '_';
    }

    var model = req.resources[param];
    var allowed = permissions[role].split(' ');
    // TODO find changed attributes and send 403 if not allowed to set it
    for (key in req.body) {
      if (allowed.indexOf(key) >= 0) {
        var value = typeof req.body[key] == 'string' ? req.body[key].trim() : req.body[key];
        if (hasRedundancyPlugin(model)) {
          model.update(key, value);
        } else {
          model[key] = value;
        }
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
    next();
  }
}


exports.outputPage = function (resource, view) {
  return function (req, res, next) {
    var models = req.resources[resource];
    var views = [];
    for (var i = 0, l = models.length; i < l; i++) {
      views.push(view(models[i], req));
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
    }
    if (!req.query.limit) {
      req.query.limit = API_LIST_LIMIT;
    }
    var conditions = {};
    var schema = Models[type].schema.tree;
    for (attribute in req.query) {
      if (schema.hasOwnProperty(attribute.split('.')[0])) {
        if (mongoose.Types.ObjectId.isValid(req.query[attribute])) {
          conditions[attribute] = mongoose.Types.ObjectId(req.query[attribute]);
        } else {
          conditions[attribute] = req.query[attribute];
        }
      }
    }
    // The controller query always take presedence over user input
    var _query = query;
    if (typeof query == 'function') {
      _query = query(req);
    }
    for (name in _query) {
      conditions[name] = _query[name];
    }
    var sort = {};
    if (req.query.sort && typeof req.query.sort == 'string') {
      var sortFields = req.query.sort.split(',');
      for (var i = 0, l = sortFields.length; i < l; i++) {
        var direction = 1;
        var fieldDirection = sortFields[i].split(':');
        if (fieldDirection.length > 0 && fieldDirection[1] == 'desc') {
          direction = -1;
        }
        sort[fieldDirection[0]] = direction;
      }
    }

    mongoose.model(type).count(conditions, function (err, count) {
      if (count == 0) {
        req.resources[param] = [];
        req.resources[param].count = count;
        next();
      } else {
        mongoose.model(type).find(conditions).sort(sort).limit(req.query.limit).skip(req.query.skip).exec(function (err, models) {
          req.resources[param] = models;
          req.resources[param].count = count;
          next();
        })
      }
    })

  }
}

exports.load = function (types) {
  return function (req, res, next) {
    if (!req.resources) req.resources = {};
    async.forEachOf(types, function (type, param, callback) {
      if (!req.params[param]) return callback();
      mongoose.model(type.split('.')[0]).findOne(getQuery(req, type, param), function (err, model) {
        if (err) callback(err)
        else if (!model) callback(type)
        else {
          req.resources[param] = model;
          callback()
        }
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

exports.createAccessToken = function (param, client_id) {
  return function (req, res, next) {
    var account = req.resources[param];
    OAuth.generateToken('accessToken', req, function (err, access_token) {
      if (err) throw err;
      OAuth.saveAccessToken(access_token, client_id, moment().add(1, 'month'), account, function (err, token) {
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

exports.email = function (content, wait) {
  if (content.from && content.from.indexOf('@') < 0) {
    content.from += '@polynect.io';
  }

  return function (req, res, next) {
    if (content.template) {
      if (typeof content.locals == 'function') {
        var locals = content.locals(req)
      } else {
        var locals = content.locals;
      }
      var text = Templates.email(content.template, locals);
    } else {
      var text = content.text;
    }

    var to = content.to;
    if (typeof to == 'function') {
      to = to(req);
    }

    sendgrid.send({
      to:       to,
      from:     content.from || 'support@polynect.io',
      subject:  content.subject || 'No subject',
      html:     text || ''
    }, function(err, json) {
      if (err && !process.env.MOCK_SERVICES) { return console.error(err); }
      if (wait == true) {
        if (!err) {
          next();
        } else {
          next(new Error("Failed to send email"));
        }
      }
    });
    // If we dont want to wait for the http request to finish
    if (wait == null || wait == false) {
      next();
    }
  }
}

exports.success = function (message) {
  return function (req, res, next) {
    if (typeof message == 'function') {
      res.success(200, message(req));
    } else {
      res.success(200, message);
    }
  };
}

function getQuery(req, type, param) {
  var _parts = type.split('.');
  var type = _parts[0];
  var key = _parts[1] || '_id';
  var query = {};
  query[key] =  req.params[param];
  return query;
}

exports.delete = function (param, type, message) {
  return function (req, res, next) {
    mongoose.model(type.split('.')[0]).find(getQuery(req, type, param)).remove(function (err) {
      if (err) throw err
      if (message === false) {
        return next();
      } else {
        if (message != null) {
          res.success(200, message);
        } else {
          res.success(200, 'Deleted ' + type);
        }
      }
      next();
    });
  }
}
