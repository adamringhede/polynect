var nock = require('nock');


exports.sendgrid = nock('https://api.sendgrid.com')
  .post('/api/mail.send.json')
  .reply(200, {
    message: 'success'
  });

exports.hooks_bad = nock('https://bad-hook.polynect.io')
  .post('/hooks')
  .reply(500, {
    message: 'Internal server error'
  });

exports.hooks_good = nock('https://good-hook.polynect.io')
  .post('/hooks')
  .reply(200, {
    message: 'OK'
  });