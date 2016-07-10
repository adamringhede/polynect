"use strict";

var WebSocketServer = require('websocket').server;
var http = require('http');
const EventEmitter = require('events');
var API = require('./..');

var MAX_CONNECTIONS = 500;

module.exports = 
class Server extends EventEmitter {

  constructor(port, ns) {
    super();
    var self = this;
    this.connections = 0;

    /*var server = http.createServer(function(request, response) {
      console.log((new Date()) + ' Received request for ' + request.url);
      response.writeHead(404);
      response.end();
    });
    server.listen(port, function() {
      console.log((new Date()) + ' Server is listening on port ' + port);
    });*/
     
    var wsServer = new WebSocketServer({
      httpServer: API.server,
      // You should not use autoAcceptConnections for production 
      // applications, as it defeats all standard cross-origin protection 
      // facilities built into the protocol and the browser.  You should 
      // *always* verify the connection's origin and decide whether or not 
      // to accept it. 
      autoAcceptConnections: false
    });
     
    function originIsAllowed(origin) {
      // put logic here to detect whether the specified origin is allowed. 
      return true;
    }
     
    wsServer.on('request', function(request) {
      if (self.connections > MAX_CONNECTIONS) {
        return reject('Busy');
      }

      if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin 
        request.reject();
        return;
      }
      
      var connection = request.accept('match.polynect.io', request.origin);
      self.connections++;

      try {
        self.emit('request', request, connection);
      } catch (e) {
        console.log(e);
      }

      connection.on('close', function(reasonCode, description) {
        self.connections--;
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
      });
    });
  } 
}

