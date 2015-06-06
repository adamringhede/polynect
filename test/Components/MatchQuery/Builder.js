var assert = require('assert');
var Builder = require('../../../lib/Components/MatchQueryBuilder/MatchQueryBuilder');

describe('MatchQueryBuilder', function() {

  describe('getValue', function() {
    it('can return input values', function() {
      var builder = new Builder(
        require('./Configs/Complex'), // Config
        { y: 'bar' } // Values
      );
      var value = builder.getValue(builder.config.attributes.y)
      assert.equal(value, 'bar');
    });
    it('can use a default value if an input value is undefined', function() {
      var builder = new Builder(
        require('./Configs/Complex') // Config
      );
      var value = builder.getValue(builder.config.attributes.y)
      assert.equal(value, 'foo');
    });
  });

  describe('build', function() {
    it('compiles requirements into a mongo query', function() {
      var builder = new Builder(
        require('./Configs/Complex'),
        { y: 'bar' }, // Values
        { a: 5 }, // Player
        { b: 10 }, // Character
        'attributes' // Prefix
      );
      var query = builder.build();
      console.log(query);
      assert.ok(JSON.parse(query).$and.length > 0)
    });
  })
});
