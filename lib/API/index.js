var restify = require('restify');
var Models = require('../Models');
var Controllers = require('./Controllers');
var hooks = require('./OAuth');
var oauthserver = require('oauth2-server-restify');
var JSend = require('./Helpers/JSend');
var suppressCodes = require('./Helpers/SupressCodes');
var queryFormatter = require('./Helpers/QueryFormatter');
var rateLimiting = require('./Helpers/RateLimiting');
var formatters = require('./Helpers/Formatters');
var fs = require('fs');

if (process.env.MOCK_SERVICES) {
  var mocks = require('./Helpers/Mocks');
}

var MONGO_URI = process.env.POLYNECT_MONGO_URI || 'mongodb://localhost/polynect-test';
var PORT = process.env.PORT || process.env.POLYNECT_API_PORT || 9999

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
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With, Cache-Control, Location, X-Request");
    return next();
});

/*server.on('after', function (req, res, route, err) {
  if (err) {
    console.error(`Uncaught exception: route=${route.spec.path}`);
    console.error(err.stack);
  }
});*/
/*
server.on('uncaughtException', function (req, res, route, err) {
  console.log(`Uncaught exception: route=${route.spec.path}`);
  console.error(err.stack);
});*/

//.well-known/acme-challenge/g6AjXaXX7Ilcv_zR6yaCXHEENYGwSquK7OzhciVS3QQ
server.get(/g6AjXaXX7Ilcv_zR6yaCXHEENYGwSquK7OzhciVS3QQ/, (req, res, next) => {
  let body = "g6AjXaXX7Ilcv_zR6yaCXHEENYGwSquK7OzhciVS3QQ.vRn-41SNGgZLDsvNIPqNkas-JyJ1zeEbZWKaD0VHodo";
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'text/html'
  });
  res.write(body);
  res.end();
});

// Selects version v1 unless a version is specified
server.pre(function (req, res, next) {
  if (!/^\/v\d+/.test(req.getPath()) && !/^\/oauth/i.test(req.getPath())) {
    req.url = '/v1' + req.url;
  }
  next();
});

//server.server.setTimeout(5000);

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

server.get('/v1', function (req, res, next) {
  res.send('Happy matchmaking! If you have any questions, don\'t hesitate to email info@polynect.io.');
  next();
});

// Ignores lack of authentication for public endpoints
var ignore = {
  POST: [
    /^\/v\d+\/players\/?$/i,
    /^\/v\d+\/games\/\w+\/login/i,
    /^\/oauth/i,
    /^\/v\d+\/login/i,
    /^\/v\d+\/accounts\/(activate|reset_password|forgot_password|register)/i,
    /^\/v\d+\/accounts$/i
  ],
  GET: [
    /^\/v\d+\/accounts\/reset_password/i,
    /^\/v\d+\/accounts\/activate/i
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
});

// Apply rate limiting
server.use(rateLimiting());



server.post('/oauth/token', server.oauth.grant());

// Start
server.listen(PORT);
console.log("API listening on port " + PORT);

Models.Account.count(function (err, count) {
  console.log("Verifying database connection... Success! " + (count > 1 ? "There are " + count + " accounts." : "There is one account."));
});

// Initiating controllers
for (var name in Controllers) {
  Controllers[name](server);
}

exports.server = server;

require('./Sub');
