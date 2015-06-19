var restify = require('restify');
var Models = require('../Models');
var Controllers = require('./Controllers');

Models.init('mongodb://localhost/polynect-test');

PORT = process.env.POLYNECT_API_PORT ? parseInt(process.env.POLYNECT_API_PORT) : 80


var server = restify.createServer({
  name: 'Polynect',
});

// Plugins
server.use(restify.bodyParser());
server.use(restify.queryParser());
server.pre(restify.pre.sanitizePath());
server.use(restify.jsonp());

// Start
server.listen(PORT);
console.log("API listening on port " + PORT);

for (name in Controllers) {
  Controllers[name](server);
}
