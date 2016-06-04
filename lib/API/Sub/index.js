"use strict"

var Server = require('./Server');
var Views = require('../Views');
var Models = require('../../Models');
var amqp = require('amqplib/callback_api');

// accepts connections to listen on a certain match's events.
// verifies that the user has access to this match with basic auth.   
// creates a queue with the id of the match 


var server = new Server(8080, 'matches');

server.on('request', function (request, connection) {
  var params = request.resourceURL.path.split('/').slice(2);
  //console.log("Received request to subscribe to match " + params[0]);
  var match = Models.Match.findById(params[0],  function (err, match) {
    if (!match) {
      console.log("Match not found: " + params[0]);
      return request.reject("Can not find match");
    } else {
      subscribe(match, connection);
    }
  });
});

var mqReady = new Promise(function (resolve, reject) {
  amqp.connect(process.env.AMQP_URL || 'amqp://localhost', function(err, conn) {
    if (err) return reject(err);
    conn.createChannel(function(err, ch) {
      if (err) return reject(err);
      var ex = 'match_updates';
      ch.assertExchange(ex, 'topic', {durable: false});
      resolve(ch);
    });
  });
})

function subscribe(match, connection) {
  var routeKey = 'matches.' + match.game.id + '.' + match._id + '.update';
  var options = {
    durable: false,
    exclusive: true,
    autoDelete: true
  };

  mqReady.then(function(ch) {
    ch.assertQueue('', options, function(err, q) {
      ch.bindQueue(q.queue, 'match_updates', routeKey);
      ch.consume(q.queue, function(msg) {
        connection.sendUTF(msg.content.toString());
      }, {noAck: true});
    });
  }).catch(function (err) {
    console.log(err);
  });
}