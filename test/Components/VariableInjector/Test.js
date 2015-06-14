var assert = require('assert');
var inject = require('../../../lib/Components/VariableInjector')



describe('VariableInjector', function () {
  var A = '$FOO $BAR!'
  var B = 'var x = $OBJ'

  it('can change the value of variables', function () {
    var result = inject(A, {
      FOO: 'Hello',
      BAR: 'World'
    });
    assert.equal(result, 'Hello World!');
  })
  it('can change variable values to object litels', function () {
    var result = inject(B, {
      OBJ: {
        v: ['x']
      }
    })
    assert.equal(result, 'var x = {"v":["x"]}');
  });

});
