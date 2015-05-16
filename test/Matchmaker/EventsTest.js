var assert = require('assert');
var Matchmaker = require('../../lib/Matchmaker');
var Request = require('../../lib/Models').Request;

describe('Matchmaking request events', function () {
  describe('matched', function () {
    it('occures after two or more requests have been matched', function (done) {
      var m = new Matchmaker();
      var r1 = new Request();
      var r2 = new Request();
      r1.requirements = {};
      r2.requirements = {};
      m.put(r1);
      m.put(r2);
      r1.on('matched', function (match) {
        assert.ok(r1.removed);
        assert.ok(r2.removed);
        done()
      });
      m.start();
    });
    it('occures after a request is added to an existing match', function (done) {
      var m = new Matchmaker();
      var r1 = new Request({
        min: 4
      });
      var r2 = new Request();
      r1.requirements = {};
      r2.requirements = {};
      m.put(r1);
      m.put(r2);
      m.start();
      var r3 = new Request();
      r3.on('matched', function (match) {
        assert.equal(match.requests.length, 3);
        done()
      })
      m.put(r3);
      m.start();

    });
  });

});
