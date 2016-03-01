var nock = require('nock');


exports.sendgrid = nock('https://api.sendgrid.com')
  .post('/api/mail.send.json')
  .reply(200, {
    message: 'success'
  });
