const request = require('request-promise');
const Models = require('../../Models');
const restify = require('restify');

function buildUrl(titleId, path) {
  return `https://${titleId}.playfabapi.com/${path}`
}

function buildRequest(titleId, path) {
  return request({
    uri: buildUrl(titleId, path),
    json: true // Automatically parses the JSON string in the response
  })
}

exports.getUserData = function (titleId, playerId, secretKey, readonly) {
  const path = readonly
    ? 'Server/GetUserReadOnlyData'
    : 'Server/GetUserData';
  return request({
    method: 'POST',
    uri: buildUrl(titleId, path),
    headers: {
      'X-SecretKey': secretKey
    },
    body: {
      PlayFabId: playerId
    },
    json: true
  })
};

exports.getCharacterData = function (titleId, playerId, characterId, secretKey, readonly) {
  const path = readonly
    ? 'Server/GetCharacterReadOnlyData'
    : 'Server/GetCharacterData';
  return request({
    uri: buildUrl(titleId, path),
    method: 'POST',
    headers: {
      'X-SecretKey': secretKey
    },
    body: {
      PlayFabId: playerId,
      CharacterId: characterId
    },
    json: true
  })
};

exports.getUserDataFlat = function (titleid, playerId, secretKey, readonly) {
  return exports.getUserData(titleid, playerId, secretKey, readonly)
    .then(response => {
      const flat = {};
      for (let key of Object.keys(response.data.Data)) {
        flat[key] = response.data.Data[key];
      }
      return flat;
    })
    .catch(errors => next(new restify.errors.BadRequestError("Could not find player data")));
};

exports.getCharacterDataFlat = function (titleId, playerId, characterId, secretKey, readonly) {
  return exports.getCharacterData(titleId, playerId, characterId, secretKey, readonly)
    .then(response => {
      const flat = {};
      for (let key of Object.keys(response.data.Data)) {
        flat[key] = response.data.Data[key];
      }
      return flat;
    })
};

exports.authRequest = function (secretKey, req, next) {
  const auth = req.headers.authorization.split(' ');
  if (auth[0].toLowerCase() !== 'playfab') {
    return next()
  }
  const sessionTicket = auth[1];
  const titleId = sessionTicket.split('-')[3];
  exports.authUser(titleId, sessionTicket, secretKey)
    .then((response) => {
      if (response.status != 'OK') {
        next(new restify.errors.InvalidCredentialsError("Received a non-OK response from PlayFab"))
      } else if (response.data.Authorized == false) {
        next(new restify.errors.InvalidCredentialsError())
      } else {
        const player = new Models.Account();
        player.player_id = response.data.PlayFabId;
        player.role = 'playfab';
        req.user = player;
        next()
      }
    }).catch((response) => next(new restify.errors.InvalidCredentialsError()))
};

exports.authUserAsClient = function (titleId, sessionTicket) {
  return request({
    method: 'POST',
    uri: buildUrl(titleId, 'Client/GetAccountInfo'),
    headers: {
      'X-Authentication': secretKey
    },
    json: true
  }).then(response => { return {
    authorized: true,
    playerId: response.data.AccountInfo
  }})
};

exports.authUser = function (titleId, sessionTicket, secretKey) {
  return request({
    method: 'POST',
    uri: buildUrl(titleId, 'Matchmaker/AuthUser'),
    headers: {
      'X-SecretKey': secretKey
    },
    body: {
      AuthorizationTicket: sessionTicket
    },
    json: true 
  })
};