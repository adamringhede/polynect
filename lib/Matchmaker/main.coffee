restify = require('restify');
request = require('request');
Models = require('../Models');
Matchmaker = require('./Matchmaker');

matchmaker = new Matchmaker();

# Get configuration
HOST = process.env.MATCHMAKER_SERVER_PUBLIC_HOST? or process.argv[2]?.split(':')[0] or 'localhost'
PORT = parseInt(process.env.MATCHMAKER_SERVER_PUBLIC_PORT? or process.argv[2]?.split(':')[1] or 48001)

Models.init('mongodb://localhost/polynect-test');

server = restify.createServer({
  name: 'Polynect-matchmaker',
});

# Plugins
server.use(restify.bodyParser());
server.use(restify.queryParser());
server.use(restify.jsonp());

# Start
server.listen(PORT);
console.log("Listening on port " + PORT);

server.put('/start/:id', (req, res, next) ->

  # Reserve request
  Models.Request.findByIdAndUpdate(req.params.id, {
    reserved: true,
    matchmaker:
      host: HOST
      port: PORT
  }, (err, model) ->
    wait = 1;
    responded = false;
    if parseFloat(req.query.wait) > 0
      wait = parseFloat(req.query.wait);

    tO = setTimeout( () ->
      if responded
        return;
      responded = true
      res.send(202, 'Could not finish matchmaking within ' + wait + ' seconds');
    , wait * 1000)

    model.on 'finished', (match) ->
      if responded
        return;
      responded = true
      clearTimeout(tO);
      if (match.isDone())
        res.send(200, 'Finished matchmaking');
    matchmaker.put(model, true) # Put first in queue
    if matchmaker.queue.length > 1
      matchmaker.start();
  )
)
