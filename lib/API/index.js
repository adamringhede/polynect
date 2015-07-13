var restify = require('restify');
var Models = require('../Models');
var Controllers = require('./Controllers');
var hooks = require('./OAuth');
var restifyOAuth2 = require("restify-oauth2");
var oauthserver = require('oauth2-server-restify');

Models.init('mongodb://localhost/polynect-test');

var PORT = process.env.POLYNECT_API_PORT ? parseInt(process.env.POLYNECT_API_PORT) : 80


var server = restify.createServer({
  name: 'Polynect',
});


// Plugins
server.use(restify.queryParser());
server.pre(restify.pre.sanitizePath());
server.use(restify.jsonp());
server.use(restify.authorizationParser());
server.use(restify.bodyParser());

// OAuth
server.oauth = oauthserver({
  model: hooks,
  grants: ['password'],
  debug: true
});
server.post('/oauth/token', server.oauth.grant());

var ignore = {
  POST: [/\/games\/\w+\/players/i]
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



// Start
server.listen(PORT);
console.log("API listening on port " + PORT);

for (name in Controllers) {
  Controllers[name](server);
}
