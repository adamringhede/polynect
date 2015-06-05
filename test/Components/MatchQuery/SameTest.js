var Same = require('../../../lib/Components/MatchQueryBuilder/Same');
var assert = require('assert');

describe('Same query', function() {
  it('returns a valid mongo query', function() {
    var q = Same.build('x', {type: 'same', value: 'player.x'}, 43);
    assert.deepEqual(q, {
      'x': 43
    })
  })
  it('works with objects and strings', function() {
    var q = Same.build('x', {type: 'same', value: 'player.x'}, {x:23, b:"test"});
    assert.deepEqual(q, {
      'x': {
        x: 23,
        b: "test"
      }
    })
  });
});
// TODO Add tests for all faulty options
