var Close = require('../../../../lib/Components/MatchQueryBuilder/Close');
var assert = require('assert');

describe('Close query', function() {
  it('returns a valid mongo query', function() {
    var q = Close.build('x', {type: 'close', value: 'player.x', distance: 5}, 43);
    assert.deepEqual(q, {
      'x': {
        $lte: 48,
        $gte: 38
      }
    })
  })
});
// TODO Add tests for all faulty options
