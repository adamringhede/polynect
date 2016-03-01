var assert = require('assert');
var Templates = require('../../lib/Templates');

describe('Templates', function () {
  beforeEach(function () {
    Templates.clearCache();
  });
  describe('Email', function () {
    it('caches remplates', function () {
      var start = Date.now();
      Templates.email('reset_password', {
        firstname: 'Jack',
        reset_link: 'http://example.com/'
      });
      var firstDuration = Date.now() - start;

      var start = Date.now();
      var template = Templates.email('reset_password', {
        firstname: 'Jack',
        reset_link: 'http://example.com/'
      });
      var secondDuration = Date.now() - start;
      assert.ok(secondDuration < firstDuration);
      assert.ok(/Hi Jack/.test(template));
    });
  })

});
