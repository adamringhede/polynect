var assert = require('assert');
var Models = require('../../lib/Models');
var ObjectId = require('objectid');

Models.init();

var fixturesData = {
  Account: {
    p1: {
      _id: ObjectId(),
      username: 'test@test.com'
    }
  },
  Game: {
    g1: {
      _id: ObjectId(),
      name: 'test'
    }
  }
};

describe('Loading fixtures', function () {
  it('returns created models', function (done) {
    Models.load(fixturesData, function (f) {
      assert.equal(f.Account.p1.username, 'test@test.com');
      done();
    })
  });
});
