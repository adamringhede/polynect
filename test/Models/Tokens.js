var assert = require('assert');
var Models = require('../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var Schema = mongoose.Schema;

Models.init('mongodb://localhost/polynect-test');

describe('Tokens', function () {
  beforeEach(function (done) {
    Models.load({AccessToken: {}, RefreshToken: {}}, function () { done() })
  });

  it ('can be created using a common create method', function (done) {
    var token = Models.OAuth.AccessToken.create(100);
    console.log(token);

    var token = Models.OAuth.RefreshToken.create();
    console.log(token);

  });

});
