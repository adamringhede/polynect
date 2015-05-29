var assert = require('assert');
var request = require('request');
var Models = require('../../../lib/Models');

Models.init('mongodb://localhost/polynect-test')

process.env.POLYNECT_API_PORT = 8090;

// Start API
require('../../../lib/API')

// Clear database
Models.Player.collection.remove();

var access_tokens = {
  facebook: 'CAACEdEose0cBAOZARvWUP5JZAq4xxftI8SZA5NWnGZAb9LCgxjDIcPM664mzxu6ucF1363Uu9OnXj8Pt4iW7QsLSpLZBRwPHtS3OZCVBNpkV6pxsD3dmxdR1w95sAU2Kr6r1zsEkINZBPZBO4xyryVnr2VQ5eRcZBmQK2bloZAmIkiSokcF4fxwBA4Wek7ZCCvCy4u5ZBDV40rwZAg3yjjPVm2FT9'
};

describe('Login with provider', function () {
  it('works with facebook', function (done) {
    request({ method: 'POST', json: true, url: 'http://localhost:8090/login/facebook',
      body: {access_token: access_tokens.facebook} }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(typeof body.token, 'string');
        assert.equal(typeof body.token_expires, 'string');
        done();
      });

  });
});
