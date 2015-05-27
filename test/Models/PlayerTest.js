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
});
