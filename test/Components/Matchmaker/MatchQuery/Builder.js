var assert = require('assert');
var Builder = require('../../../../lib/Components/MatchQueryBuilder/MatchQueryBuilder');
var ObjectId = require('objectid');

describe('MatchQueryBuilder', function() {
  var player = {
    _id: ObjectId(),
    a: 5
  };

  describe('getValue', function() {
    it('can return input values', function() {
      var builder = new Builder(
        require('../Configs/Complex'), // Config
        { y: 'bar' }, // Values
        player
      );
      var value = builder.getValue(builder.config.attributes.y)
      assert.equal(value, 'bar');
    });
    it('can use a default value if an input value is undefined', function() {
      var builder = new Builder(
        require('../Configs/Complex'), // Config
        {},
        player
      );
      var value = builder.getValue(builder.config.attributes.y)
      assert.equal(value, 'foo');
    });
  });

  describe('build', function() {
    it('compiles requirements into a mongo query', function() {
      var builder = new Builder(
        require('../Configs/Complex'),
        { y: 'bar' }, // Values
        player, // Player
        { b: 10 }, // Character
        'attributes' // Prefix
      );
      var query = builder.build();
      assert.ok(query.$and.length > 0)
    });
    it('relaxes values on each attempt', function() {
      var builder = new Builder(
        require('../Configs/Complex'), null, player,
        { b: 10 } // Character
      );
      builder.setAttempt(2);
      var query = builder.build();
      assert.equal(query.$and[3].z.$gte, 5.5);
    });
  })
});
