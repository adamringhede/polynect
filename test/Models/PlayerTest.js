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
    it ('can be set using dot notation', function () {
      var p = new Player();
      p.set('data.a.b.c', 'foo');
      var foo = p.get('data.a.b.c');
      assert.equal(foo, 'foo');
    })
    it ('keep changes after save', function (done) {
      var p = new Player();
      p.set('data.a.v', 'foo');
      p.set('data.e.a', ['x', 2]);
      p.push('data.a.l', 'a');
      p.push('data.a.l', 'b');
      p.insert('data.a.l', 'c', 0);
      p.empty('data.e.a');
      p.save(function () {
        Player.findOne({_id: p._id}, function (err, p) {
          assert.equal(p.get('data.a.v'), 'foo');
          assert.deepEqual(p.get('data.a.l'), ['c', 'a', 'b']);
          assert.equal(p.get('data.e.a').length, 0);
          done();
        })
      });
    });
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
