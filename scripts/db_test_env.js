var Models = require('../lib/Models');
var ObjectId = require('objectid');

Models.init()

var adminId = ObjectId('55aaabb5acbb5c03003d0bf0');
var clientId = ObjectId('55aaabb5acbb5c03003d0bf1');
var gameId = ObjectId('55aaabb5acbb5c03003d0bf2');
var playerId1 = ObjectId('55aaabb5acbb5c03003d0bf3');
var playerId2 = ObjectId('55aaabb5acbb5c03003d0bf4');
Models.load({
  Account: {
    admin: {
      _id: adminId,
      username: 'admin',
      password_hash: Models.Account.hashPassword('secret'),
      role: 'admin'
    },
    p1: {
      _id: playerId1,
      role: 'player',
      username: 'adam@example.com',
      game: gameId,
      password_hash: Models.Account.hashPassword('secret')
    },
    p2: {
      _id: playerId2,
      role: 'player',
      username: 'david@example.com',
      game: gameId,
      password_hash: Models.Account.hashPassword('secret')
    }
  },
  Client: {
    portal: {
      _id: clientId,
      name: 'Admin portal',
      client_id: Models.Client.DEV_PORTAL,
      secret: 'secret',
      holder: adminId
    }
  },
  Game: {
    g1: {
      _id: gameId,
      name: 'test game'
    }
  },
}, function (fixtures) {
  process.exit();
});
