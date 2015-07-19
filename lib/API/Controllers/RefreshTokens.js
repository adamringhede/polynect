var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  route.post('/v1/refreshTokens',
    $.require('token client_id holder'),
    $.restrict('admin'),
    $.create('refreshToken', 'RefreshToken', {
      admin: 'token client_id holder'
    }),
    $.output('refreshToken', Views.Token)
  );

  route.get('/v1/refreshTokens/:refreshToken',
    $.restrict('admin'),
    $.load({refreshToken: 'RefreshToken'}),
    $.output('refreshToken', Views.Token)
  );

  route.get('/v1/refreshTokens',
    $.restrict('admin'),
    $.loadList('refreshTokens', 'RefreshToken'),
    $.outputPage('refreshTokens', Views.Token)
  );

  route.del('/v1/refreshTokens/:refreshToken',
    $.restrict('admin'),
    $.delete('refreshToken', 'RefreshToken')
  );

}
