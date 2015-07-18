var Models = require('../lib/Models');
var ObjectId = require('objectid');

Models.init()

var adminId = ObjectId();
var clientId = ObjectId();
Models.load({
  Account: {
    admin: {
      _id: adminId,
      username: 'admin',
      password_hash: Models.Account.hashPassword('secret'),
      role: 'admin'
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
  }
}, function (fixtures) {
  process.exit();
});
