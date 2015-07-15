var restify = require('restify');
var Models = require('../Models');
var Controllers = require('./Controllers');
var hooks = require('./OAuth');
var restifyOAuth2 = require("restify-oauth2");
var oauthserver = require('oauth2-server-restify');
var JSend = require('./Helpers/JSend');
var suppressCodes = require('./Helpers/SupressCodes');
var queryFormatter = require('./Helpers/QueryFormatter');
var formatters = require('./Helpers/Formatters');

Models.init('mongodb://localhost/polynect-test');

var PORT = process.env.POLYNECT_API_PORT ? parseInt(process.env.POLYNECT_API_PORT) : 80


var server = restify.createServer({
  name: 'Polynect',
  formatters: formatters
});


// Plugins
server.use(restify.queryParser());
server.pre(restify.pre.sanitizePath());
server.use(restify.jsonp());
server.use(restify.authorizationParser());
server.use(restify.bodyParser({mapParams: false}));
server.use(queryFormatter());
server.use(suppressCodes());
server.use(JSend());

// OAuth
server.oauth = oauthserver({
  model: hooks,
  grants: ['password'],
  debug: true
});


var ignore = {
  POST: [/\/games\/\w+\/players|login/i, /^\/oauth/i]
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
