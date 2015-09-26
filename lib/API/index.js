var restify = require('restify');
var Models = require('../Models');
var Controllers = require('./Controllers');
var hooks = require('./OAuth');
var oauthserver = require('oauth2-server-restify');
var JSend = require('./Helpers/JSend');
var suppressCodes = require('./Helpers/SupressCodes');
var queryFormatter = require('./Helpers/QueryFormatter');
var formatters = require('./Helpers/Formatters');
var fs = require('fs');


var MONGO_URI = process.env.POLYNECT_MONGO_URI || 'mongodb://localhost/polynect-test';
var PORT = process.env.PORT || 8090

Models.init(MONGO_URI);

var server = restify.createServer({
  name: 'Polynect_API',
  formatters: formatters
});

// Selects version v1 unless a version is specified
server.pre(function (req, res, next) {
  if (!/^\/v\d+/.test(req.getPath()) && !/^\/oauth/i.test(req.getPath())) {
    req.url = '/v1' + req.url;
  }
  next();
});

restify.CORS.ALLOW_HEADERS.push('authorization');

// Plugins
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.queryParser({mapParams: false}));
server.pre(restify.pre.sanitizePath());
server.use(restify.jsonp());
server.use(restify.authorizationParser());
server.use(restify.bodyParser({mapParams: false}));
server.use(queryFormatter());
server.use(suppressCodes());
server.use(JSend());
server.use(function (req, res, next) { // Reverse map params
  if (!req.body) {
    req.body = {};
  }
  for (param in req.params) {
    if (!req.body[param]) req.body[param] = req.params[param];
  }
  for (key in req.body) {
    if (!req.params[key]) req.params[key] = req.body[key];
  }
  next();
});

// OAuth
server.oauth = oauthserver({
  model: hooks,
  grants: ['password'],
  debug: true
});


var ignore = {
  POST: [/^\/v\d+\/games\/\w+\/players\/?$/i, /^\/v\d+\/games\/\w+\/login/i, /^\/oauth/i, /^\/v\d+\/accounts/i]
}
server.use(function (req, res, next) {
  var authenticate = true;
  if (ignore[req.method]) {
    for (var i = 0, l = ignore[req.method].length; i < l; i++) {
      if (ignore[req.method][i].test(req.getPath())) {
        authenticate = false;
        break;
      }
    }
  }
  if (authenticate) {
    server.oauth.authorise()(req, res, next);
  } else {
    next();
  }
})

server.post('/oauth/token', server.oauth.grant());

// Start
server.listen(PORT);
console.log("API listening on port " + PORT);

for (name in Controllers) {
  Controllers[name](server);
}
