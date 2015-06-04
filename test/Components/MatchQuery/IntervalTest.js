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
});
// TODO Add tests for all faulty options
