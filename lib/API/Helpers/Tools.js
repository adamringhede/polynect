"use strict";

var mongoose = require('mongoose');
var async = require('async');
var restify = require('restify');
var Models = require('../../Models');
var OAuth = require('../OAuth');
var moment = require('moment');
var jade = require('jade');
var sendgrid = require('sendgrid')(process.env['SENDGRID_USERNAME'], process.env['SENDGRID_PASSWORD']);
var Templates = require('../../Templates');
var AMQP = require('./AMQP');

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
};

exports.forbid = function (roles, fn) {
  return function (req, res, next) {
    if (roles.indexOf(req.user.role) >= 0 && fn(req) == true) {
      next(new restify.errors.NotAuthorizedError());
    } else {
      next();
    }
  }
};

exports.output = function (resource, view, populate = []) {
  return function (req, res, next) {
    async.each(populate, (ref, callback) => {
      req.resources[resource].populate(ref, callback)
    }, () => {
      res.success(200, view(req.resources[resource], req));
      return next();
    })

  }
};

exports.create = function (param, type, permissions, defaults) {
  return function (req, res, next) {
    var role;
    if (req.user) {
      role = req.user.role;
    } else {
      role = '_';
    }
    var model = new (mongoose.model(type))();
    var allowed = permissions[role].split(' ');
    var key;
    for (key in req.body) {
      if (req.body.hasOwnProperty(key) && allowed.indexOf(key) >= 0) {
        var value = typeof req.body[key] == 'string' ? req.body[key].trim() : req.body[key];
        if (hasRedundancyPlugin(model)) {
          model.update(key, value);
        } else {
          model[key] = value;
        }
      }
    }
    for (key in defaults) {
      if (!defaults.hasOwnProperty(key)) continue;
      if (!req.body.hasOwnProperty(key) || req.body[key] == null)
        model[key] = defaults[key];
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
};

exports.update = function (param, permissions) {
  return function (req, res, next) {
    var role;
    if (req.user) {
      role = req.user.role;
    } else {
      role = '_';
    }
    var model = req.resources[param];
    var allowed = permissions[role].split(' ')
      .map(field => field.split(':'))
      .map(parts => { return parts.length > 1
        ? {key: parts[1], opt: parts[0]}
        : {key: parts[0], opt: null} });
    for (let field of allowed) {
      if (req.body.hasOwnProperty(field.key)) {
        var value = typeof req.body[field.key] == 'string' ? req.body[field.key].trim() : req.body[field.key];
        if (field.opt == '+') {
          if (model[field.key] != null && typeof model[field.key] == 'object' && value != null) {
            value = Object.assign(model[field.key], value)
          }
        }
        if (hasRedundancyPlugin(model)) {
          model.update(field.key, value);
        } else {
          model[field.key] = value;
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

exports.roleDefault = function (role, defaults) {
  return function (req, res, next) {
    if (req.user.role == role) {
      exports.default(defaults)(req, res, next)
    }
  }
}

exports.default = function (defaults) {
  return function (req, res, next) {
    if (typeof defaults == 'function') {
      defaults = defaults(req)
    }
    for (var key in defaults) {
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

exports.loadList = function (param, type, query, populate = []) {
  return function (req, res, next) {
    if (!req.resources) req.resources = {};
    // Set defaults
    if (!req.query.skip) {
      req.query.skip = 0;
    }
    if (!req.query.limit) {
      req.query.limit = API_LIST_LIMIT;
    }
    // Use the the model (type) to determine what type the conditions have.
    var conditions = {};
    var schema = Models[type].schema.tree;
    for (var attribute in req.query) {
      if (!req.query.hasOwnProperty(attribute)) continue;
      if (schema.hasOwnProperty(attribute.split('.')[0])) {
        if (mongoose.Types.ObjectId.isValid(req.query[attribute])) {
          conditions[attribute] = mongoose.Types.ObjectId(req.query[attribute]);
        } else {
          conditions[attribute] = req.query[attribute];
        }
      }
    }
    // The controller query always take precedence over user input
    var _query = query;
    if (typeof query == 'function') {
      _query = query(req);
    }
    for (var name in _query) {
      if (_query.hasOwnProperty(name)) {
        conditions[name] = _query[name];
      }
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
        // TODO validate option, eg. des should not result in asc just because it's the default
        sort[fieldDirection[0]] = direction;
      }
    }

    mongoose.model(type).count(conditions, function (err, count) {
      if (count == 0) {
        req.resources[param] = [];
        req.resources[param].count = count;
        next();
      } else {
        const qb = mongoose.model(type)
          .find(conditions)
          .sort(sort)
          .limit(req.query.limit)
          .skip(req.query.skip);
        populate.forEach((field) => qb.populate(field));
        qb.exec(function (err, models) {
          req.resources[param] = models;
          req.resources[param].count = count;
          next();
        })
      }
    })

  }
};

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
};

exports.createAccessToken = function (param, client_id, months = 1) {
  return function (req, res, next) {
    var account;
    if (param == '@') {
      account = req.user;
    } else {
      account = req.resources[param];
    }
    OAuth.generateToken('accessToken', req, function (err, access_token) {
      if (err) throw err;
      OAuth.saveAccessToken(access_token, client_id, moment().add(months, 'month'), account, function (err, token) {
        if (err) throw err;
        req.oauth = token;
        next();
      });
    });
  }
};

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
};

exports.email = function (content, wait) {
  if (content.from && content.from.indexOf('@') < 0) {
    content.from += '@polynect.io';
  }

  return function (req, res, next) {
    var text;
    if (content.template) {
      var locals;
      if (typeof content.locals == 'function') {
        locals = content.locals(req)
      } else {
        locals = content.locals;
      }
      text = Templates.email(content.template, locals);
    } else {
      text = content.text;
    }

    var to = content.to;
    if (typeof to == 'function') {
      to = to(req);
    }

    sendgrid.send({
      to:       to,
      from:     content.from ||??'support@polynect.io',
      subject:  content.subject ||??'No subject',
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
    if (wait == null ||??wait == false) {
      next();
    }
  }
};

exports.success = function (message) {
  return function (req, res, next) {
    if (typeof message == 'function') {
      res.success(200, message(req));
    } else {
      res.success(200, message);
    }
  };
};

function getQuery(req, type, param) {
  var _parts = type.split('.');
  //var type = _parts[0];
  var key = _parts[1] ||??'_id';
  var query = {};
  query[key] =  req.params[param];
  return query;
}

exports.delete = function (param, type, message) {
  return function (req, res, next) {
    mongoose.model(type.split('.')[0]).find(getQuery(req, type, param)).remove(function (err) {
      if (err) throw err;
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
};


exports.publishTopic = function (topic, config) {


  return function(req, res, next) {
    var conf = typeof config == 'function' ? config(req) : config;
    AMQP.getChannel().then(function (ch) {
      ch.assertExchange(topic, 'topic', {durable: false});
      ch.publish(topic, conf.key, new Buffer(JSON.stringify(conf.msg)));
      next();
    }).catch(function (err) {
      console.log(err);
    })
  }
};
