var Interval = require('../../../lib/Components/MatchQueryBuilder/Interval');
var assert = require('assert');

var interval = new Interval();

describe('Interval query', function() {
  it('returns a valid mongo query', function() {
    var q = interval.build('x', {type: 'interval', intervals: [[0,2],[3,5]], value:'player.x'}, 4);
    assert.deepEqual(q, {
      'x.0':3,
      'x.1':5
    })
  });
  it('can take a single value instead of interval', function() {
    var q = interval.build('x', {type: 'interval', intervals: [[0,2],3], value:'player.x'}, 3);
    assert.deepEqual(q, {
      'x.0':3,
      'x.1':3
    })
  });
  describe('validation result', function() {
    it('is null if it is valid', function() {
      var errors = Interval.validate({
        intervals: [[1,4],[5,6]]
      })
      assert.equal(errors, null);
    });
    it('contains an error if given overlapping intervals', function() {
      var errors = Interval.validate({
        intervals: [[1,4],[3,5],[5,6]]
      })
      assert.equal(errors.length, 1);
      assert.equal(errors[0], 'There are 2 overlapping intervals in [[1,4],[3,5],[5,6]]');
    });
  })
});
