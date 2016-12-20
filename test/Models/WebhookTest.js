const assert = require('assert');
const Models = require('../../lib/Models');
const nock = require('nock')
const crypto = require('crypto')

require('../../lib/API/Helpers/Mocks');

Models.init();

describe('Webhook', function () {

  it('can be sent to a URL', function (done) {
    const webhook = new Models.Webhook();
    webhook.url = 'https://good-hook.polynect.io/hooks';
    webhook.enabled.match_init = true;
    webhook.send('match_init', {match: {}}).then((sent) => {
      assert.ok(sent);
      done()
    })
  });

  it('will retry if status code is not 200', function (done) {
    const webhook = new Models.Webhook();
    webhook.url = 'https://bad-hook.polynect.io/hooks';
    webhook.enabled.match_init = true;
    webhook.send('match_init', {match: {}}).then((sent) => {
      assert.ok(!sent);
      done()
    })
  });

  it('is secured with an X-Hub-Signature', function (done) {
    const url = 'https://test-hooks.polynect.io'
    const secret = 'my secret'
    // Set up receiver
    nock(url).post('/').reply(200, function(uri, requestBody) {
      const signature = crypto.createHmac('sha256', secret).update(requestBody).digest('hex')
      assert.equal(this.req.headers["x-hub-signature"], signature)
      return requestBody;
    });
    // Send a hook
    const webhook = new Models.Webhook();
    webhook.url = url;
    webhook.secret = secret;
    webhook.enabled.match_init = true;
    webhook.send('match_init', {match: {}}).then((sent) => {
      assert.ok(sent, "Hook was never received")
      done()
    })
  })


});
