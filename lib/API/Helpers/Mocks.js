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

exports.playfab_auth = nock('https://14e9.playfabapi.com')
  .post('/Matchmaker/AuthUser')
  .times(999)
  .reply(200, {
    status: 'OK',
    data: {
      Authorized: true,
      PlayFabId: '4D0B49ABE6175CB2'
    }
  });

exports.playfab_data = nock('https://14e9.playfabapi.com')
  .post(/(GetCharacterData)/, {
    PlayFabId: '4D0B49ABE6175CB2',
    CharacterId: '123'
  })
  .times(999)
  .reply(400, {

  });

exports.playfab_data = nock('https://14e9.playfabapi.com')
  .post(/(GetCharacterData|GetUserData|GetCharacterReadOnlyData|GetUserReadOnlyData)/)
  .times(999)
  .reply(200, {
    status: 'OK',
    data: {
      PlayFabId: '4D0B49ABE6175CB2',
      Data: {
        foo: {
          Value: "b"
        }
      }
    }
  });