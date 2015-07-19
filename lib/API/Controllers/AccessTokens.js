var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  route.post('/accessTokens',
    $.require('token client_id holder'),
    $.restrict('admin'),
    $.create('accessToken', 'AccessToken', {
      admin: 'token client_id holder'
    }),
    $.output('accessToken', Views.Token)
  );

  route.get('/accessTokens/:client',
    $.restrict('admin'),
    $.load({client: 'AccessToken'}),
    $.output('accessToken', Views.Token)
  );

  route.get('/accessTokens',
    $.restrict('admin'),
    $.loadList('accessTokens', 'AccessToken'),
    $.outputPage('accessTokens', Views.Token)
  );

  route.del('/accessTokens/:client',
    $.restrict('admin'),
    $.delete('accessToken', 'AccessToken')
  );

}
