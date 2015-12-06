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

server.use(function crossOrigin(req,res,next){
    res.header("Content-Type", "application/json");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true")
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With, Cache-Control, Location");
    return next();
});

// Selects version v1 unless a version is specified
server.pre(function (req, res, next) {
  if (!/^\/v\d+/.test(req.getPath()) && !/^\/oauth/i.test(req.getPath())) {
    req.url = '/v1' + req.url;
  }
  next();
});

// Plugins
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

server.opts(/\.*/, function (req, res, next) {
  res.send(200);
  next();
});

// OAuth
server.oauth = oauthserver({
  model: hooks,
  grants: ['password'],
  debug: true
});


// Ignores lack of authentication for public endpoints
var ignore = {
  POST: [
    /^\/v\d+\/players\/?$/i,
    /^\/v\d+\/games\/\w+\/login/i,
    /^\/oauth/i,
    /^\/v\d+\/login/i,
    /^\/v\d+\/accounts/i
  ]
};
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

// Initiating controllers
for (name in Controllers) {
  Controllers[name](server);
}
