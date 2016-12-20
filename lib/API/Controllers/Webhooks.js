var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

const restrictDev = $.forbid('developer', function (req) {
  return req.resources.webhook.game.developer.id.toString() != req.user._id.toString();
})

module.exports = function(route) {

  route.post('/v1/webhooks',
    $.require('url game'),
    $.restrict('admin developer'),
    $.load({game: 'Game'}),
    $.forbid('developer', function (req) {
      return req.resources.game.developer.id.toString() != req.user._id.toString();
    }),
    $.create('webhook', 'Webhook', {
      admin: 'url enabled secret developer game',
      developer: 'url enabled secret game'
    }),
    $.output('webhook', Views.Webhook)
  );

  route.put('/v1/webhooks/:webhook',
    $.restrict('admin developer'),
    $.load({webhook: 'Webhook'}),
    restrictDev,
    $.update('webhook', {
      admin: 'url enabled secret',
      developer: 'url enabled secret'
    }),
    $.output('webhook', Views.Webhook)
  );

  route.get('/v1/webhooks/:webhook',
    $.restrict('admin developer'),
    $.load({webhook: 'Webhook'}),
    restrictDev,
    $.output('webhook', Views.Webhook)
  );

  route.get('/v1/webhooks',
    $.restrict('admin developer'),
    $.loadList('webhooks', 'Webhook', function (req) {
      const query = {};
      if (req.user.role == 'developer') {
        query['game.developer.id'] = req.user._id;
      }
      return query;
    }),
    $.outputPage('webhooks', Views.Webhook)
  );

  route.del('/v1/webhooks/:webhook',
    $.restrict('admin developer'),
    $.load({webhook: 'Webhook'}),
    restrictDev,
    $.delete('webhook', 'Webhook')
  );

};
