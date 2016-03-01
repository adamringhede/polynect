var request = require('request');
var Models = require('../../Models');
var Views = require('../Views');
var $ = require('../Helpers/Tools');
var restify = require('restify');

module.exports = function(route) {

  route.post('/v1/accounts',
    $.require('username password'),
    $.create('account', 'Account', {
      _: 'firstname lastname username password email',
      //developer: 'firstname lastname username password email',
      admin: 'firstname lastname username password email role'
    }),
    $.createAccessToken('account', Models.Client.DEV_PORTAL),
    $.output('account', Views.Account.withToken)
  );

  route.post('/v1/accounts/register',
    $.require('email'),
    $.create('account', 'Account', {
      _: 'firstname lastname username password email',
      admin: 'firstname lastname username password email role'
    }),
    $.email({
      to: function (req) { return req.resources.account.email; },
      subject: 'Activate developer account',
      template: 'activate_account',
      locals: function (req) {
        return {
          activation_link: req.resources.account.getActivationLink()
        };
      }
    }),
    $.createAccessToken('account', Models.Client.DEV_PORTAL),
    $.output('account', Views.Account.withToken)
  );

  route.get('/v1/accounts/activate/:account',
    $.load({account: 'Account.activation_token'}),
    $.createAccessToken('account', Models.Client.DEV_PORTAL),
    $.output('account', Views.Account.withToken)
  );

  route.post('/v1/accounts/activate/:account',
    $.require('firstname lastname password'),
    $.load({account: 'Account.activation_token'}),
    $.update('account', {
      _: 'firstname lastname password activated',
      developer: 'firstname lastname password activated'
    }),
    $.email({
      to: function (req) { return req.resources.account.email; },
      subject: 'Welcome to Polynect',
      template: 'welcome_developer',
      locals: function (req) {
        return {
          firstname: req.resources.account.firstname
        }
      }
    }),
    $.output('account', Views.Account)
  );

  route.post('/v1/accounts/forgot_password',
    $.require('email'),
    $.create('reset_token', 'PasswordResetToken', {
      _: 'email'
    }),
    $.email({
      to: function (req) { return req.body.email; },
      subject: 'Reset your Password', // steal from another service
      template: 'reset_password',
      locals: function (req) {
        return {
          firstname: req.resources.reset_token.account.firstname,
          reset_link: req.resources.reset_token.getLink()
        };
      }
    }),
    $.success('Reset password link sent')
  );

  route.get('/v1/accounts/reset_password/:reset_token',
    $.load({reset_token: 'PasswordResetToken.token'}),
    $.output('reset_token', Views.PasswordResetToken) // This view should include account details
  );

  route.post('/v1/accounts/reset_password/:reset_token',
    $.require('password'),
    $.load({reset_token: 'PasswordResetToken.token'}),
    function (req, res, next) {
      req.params.account = req.resources.reset_token.account.id;
      next();
    },
    $.load({account: 'Account'}),
    $.update('account', {
      _: 'password'
    }),
    $.delete('reset_token', 'PasswordResetToken.token', 'Password is reset')
  );

  route.put('/v1/accounts/:account',
    $.restrict('developer admin'),
    restrictToSelfUnlessAdmin(),
    $.load({account: 'Account'}),
    $.update('account', {
      developer: 'firstname lastname username email',
      admin: 'firstname lastname username email role'
    }),
    $.output('account', Views.Account)
  );

  /*
    TODO When using organisations we should allow getting other developer
    accounts if they are in one of the developer's organisations
  */
  route.get('/v1/accounts',
    $.restrict('admin'),
    $.loadList('accounts', 'Account'),
    $.outputPage('accounts', Views.Account)
  );

  route.get('/v1/accounts/:account',
    $.restrict('developer admin'),
    restrictToSelfUnlessAdmin(),
    $.load({account: 'Account'}),
    $.output('account', Views.Account)
  );

  route.del('/v1/accounts/:account',
    $.restrict('developer admin'),
    restrictToSelfUnlessAdmin(),
    $.delete('account', 'Account')
  );

}

function restrictToSelfUnlessAdmin () {
  return function (req, res, next) {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.account) {
      next(new restify.errors.ForbiddenError('You are not authorized to access others\' accounts'));
    } else {
      next()
    }
  }
}
