var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  route.post('/v1/clients',
    $.require('client_id'),
    $.restrict('admin'),
    $.create('client', 'Client', {
      admin: 'holder name client_id secret grants redirect_uri'
    }),
    $.output('client', Views.Client)
  );

  route.put('/v1/clients/:client',
    $.restrict('admin'),
    $.load({client: 'Client'}),
    $.update('client', {
      admin: 'holder name client_id secret grants redirect_uri'
    }),
    $.output('client', Views.Client)
  );

  route.get('/v1/clients/:client',
    $.restrict('admin'),
    $.load({client: 'Client'}),
    $.output('client', Views.Client)
  );

  route.get('/v1/clients',
    $.restrict('admin'),
    $.loadList('clients', 'Client'),
    $.outputPage('clients', Views.Client)
  );

  route.del('/v1/clients/:client',
    $.restrict('admin'),
    $.delete('client', 'Client')
  );

};
