"use strict";

var Models = require('../Models');

exports.getAccessToken = function (bearerToken, callback) {
  Models.AccessToken
  .findOne({ token: bearerToken })
  .populate('holder')
  .exec(function (err, model) {
    if (err || !model) callback(err, model)
    else {
      model.user = model.holder
      callback(null, model);
    }
  });
};

exports.getClient = function (clientId, clientSecret, callback) {
  Models.Client.findOne({ client_id: clientId, secret: clientSecret }, callback);
};


exports.grantTypeAllowed = function (clientId, grantType, callback) {

  if (grantType === 'password') {
    return callback(false, true);
  }

  callback(false, true);
};

exports.saveAccessToken = function (token, clientId, expires, userId, callback) {

  var accessToken = new Models.AccessToken({
    token: token,
    client_id: clientId,
    holder: userId,
    expires: expires
  });

  accessToken.save(callback);

};

/*
 * Required to support password grant type
 */
exports.getUser = function (username, password, callback) {
  console.log(username);
  Models.Developer.findOne({ username: username, password: password }, function(err, user) {
    if(err) return callback(err);
    callback(null, user._id);
  });
};

/*
 * Required to support refreshToken grant type
 */
exports.saveRefreshToken = function (token, clientId, expires, userId, callback) {

  var refreshToken = new Models.RefreshToken({
    token: token,
    client_id: clientId,
    holder: userId,
    expires: expires
  });

  refreshToken.save(callback);
};

exports.getRefreshToken = function (refreshToken, callback) {

  Models.RefreshToken.findOne({ token: refreshToken }, callback);
};
