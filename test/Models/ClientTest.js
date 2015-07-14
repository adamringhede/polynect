var assert = require('assert');
var Models = require('../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var Schema = mongoose.Schema;
var Client = Models.Client;

Models.init('mongodb://localhost/polynect-test');

beforeEach(function (done) {
  Models.load({
    Client: {
      c1: {
        _id: ObjectId(),
        client_id: 'client'
      }
    }
  }, function () { done() })
});

describe('Client', function () {


  it ('needs a unique client id', function (done) {
    var c = new Client({
      client_id: 'client'
    });
    c.save(function (err, model){
      assert.ok(err.errors.client_id);
      done();
    });

  });

});
