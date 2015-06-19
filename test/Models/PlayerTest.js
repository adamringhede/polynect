var assert = require('assert');
var Models = require('../../lib/Models');
var Player = Models.Player;

Models.init('mongodb://localhost/polynect-test');

describe('Player', function () {
  it('can be verified using a token', function () {
    var player = new Player();
    var token = player.getToken();
    assert.equal(typeof token, 'string');
    assert.ok(token.length == 30);

    assert.ok(player.verifyWithToken(token));
    assert.equal(player.verifyWithToken('invalid token'), false);

    player.removeToken();
    assert.equal(player.verifyWithToken(token), false);
  })

  describe('data', function () {
    it ('can be set using dot notation');
  });

  describe('item', function () {
    it ('receives and id when created if one is not specified')
    it ('is stored in a box')
    it ('is stored in a default box if one is not specified')
    it ('can be stacked if it has the same code')
  });

  describe('currency', function () {
    it ('can be incremented')
    it ('can be decremented')
  });

});
