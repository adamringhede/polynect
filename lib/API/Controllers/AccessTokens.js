var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  route.post('/v1/accessTokens',
    $.require('token client_id holder'),
    $.restrict('admin'),
    $.create('accessToken', 'AccessToken', {
      admin: 'token client_id holder lifetime'
    }),
    $.output('accessToken', Views.Token)
  );

  route.get('/v1/accessTokens/:accessToken',
    $.restrict('admin'),
    $.load({accessToken: 'AccessToken'}),
    $.output('accessToken', Views.Token)
  );

  route.get('/v1/accessTokens',
    $.restrict('admin'),
    $.loadList('accessTokens', 'AccessToken'),
    $.outputPage('accessTokens', Views.Token)
  );

  route.del('/v1/accessTokens/:accessToken',
    $.restrict('admin'),
    $.delete('accessToken', 'AccessToken')
  );

}
