var assert = require('assert');
var request = require('request');
var Models = require('../../../lib/Models');

Models.init('mongodb://localhost/polynect-test')

describe('Player matchmaking request', function () {

  it('can be matched on request', function (done) {
    this.timeout(3000);
    request({
      json: true,
      method: 'POST',
      url: 'http://localhost/matchmaking/requests',
      body: {requirements:{}}
    }, function (err, res, body) {
      if (res.statusCode == 500) {
        console.log(body);
      }
      assert.equal(res.statusCode, 202);
      request({
        json: true,
        method: 'POST',
        url: 'http://localhost/matchmaking/requests',
        body: {requirements:{}}
      }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        done()
      })
    })

  });
  it('can be put on queue', function (done) {
    request({
      json: true,
      method: 'POST',
      url: 'http://localhost/matchmaking/requests?wait=false',
      body: {
        "requirements": {
          "mode": {
            "type": "list",
            "value": ["free-for-all", "capture-the-flag"]
          }
        }
      }
    }, function (err, res, body) {
      assert.equal(res.statusCode, 202);
      assert.ok(!err);
      assert.equal(body.status, 'queued');
      done()
    })

  });
  it('can be cancelled', function (done) {
    var r = new Models.Request();
    r.save(function (err, model) {
      assert.ok(!err);
      assert.ok(model);
      request({
        json: true,
        method: 'PUT',
        url: 'http://localhost/matchmaking/requests/' + r._id + '/cancel'
      }, function (err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(!err);
        assert.equal(body.status, 'cancelled');
        done()
      })
    })

  })
});
