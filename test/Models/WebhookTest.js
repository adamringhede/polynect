const assert = require('assert');
const Models = require('../../lib/Models');
require('../../lib/API/Helpers/Mocks');


Models.init();

describe('Webhook', function () {

  it('can be sent to a URL', function (done) {
    const webhook = new Models.Webhook();
    webhook.url = 'https://good-hook.polynect.io/hooks';
    webhook.enable.match_init = true;
    webhook.send('match_init', {match: {}}).then((sent) => {
      assert.ok(sent);
      done()
    })
  });

  it('will retry if status code is not 200', function (done) {
    const webhook = new Models.Webhook();
    webhook.url = 'https://bad-hook.polynect.io/hooks';
    webhook.enable.match_init = true;
    webhook.send('match_init', {match: {}}).then((sent) => {
      assert.ok(!sent);
      done()
    })
  });


});
