var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {
/*
  route.post('/accounts'
    // use this for registration, similar to games/:id/players
  );
*/
  route.put('/accounts/:account',
    $.restrict('developer admin'),
    restrictToSelfUnlessAdmin(),
    $.load({account: 'Account'}),
    $.update('account', {
      developer: 'firstname lastname email',
      admin: 'firstname lastname email role'
    }),
    $.output('account', Views.Account)
  );

  /*
    TODO When using organisations we should allow getting other developer
    accounts if they are in one of the developer's organisations
  */
  route.get('/accounts',
    $.restrict('admin'),
    $.loadList('accounts', 'Account'),
    $.outputPage('accounts', Views.Account)
  );

  route.get('/accounts/:account',
    $.restrict('developer admin'),
    restrictToSelfUnlessAdmin(),
    $.load({account: 'Account'}),
    $.output('account', Views.Account)
  );

  route.del('/accounts/:account',
    $.restrict('developer admin'),
    restrictToSelfUnlessAdmin(),
    $.delete('account', 'Account')
  );

}

function restrictToSelfUnlessAdmin () {
  return function (req, res, next) {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.account) {
      res.error(403, 'You are not authorised to access others\' accounts', 'ForbiddenError');
    }
    next()
  }
}
