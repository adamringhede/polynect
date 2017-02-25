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

exports.getUserData = function (titleId, playerId, sessionTicket, readonly) {
  const path = readonly
    ? 'Client/GetUserReadOnlyData'
    : 'Client/GetUserData';
  return request({
    method: 'POST',
    uri: buildUrl(titleId, path),
    headers: {
      'X-Authentication': sessionTicket
    },
    body: {
      PlayFabId: playerId
    },
    json: true
  })
};

exports.getCharacterData = function (titleId, playerId, characterId, sessionTicket, readonly) {
  const path = readonly
    ? 'Client/GetCharacterReadOnlyData'
    : 'Client/GetCharacterData';
  return request({
    uri: buildUrl(titleId, path),
    method: 'POST',
    headers: {
      'X-Authentication': sessionTicket
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
        flat[key] = response.data.Data[key].Value;
      }
      return flat;
    })
};

exports.getCharacterDataFlat = function (titleId, playerId, characterId, secretKey, readonly) {
  return exports.getCharacterData(titleId, playerId, characterId, secretKey, readonly)
    .then(response => {
      const flat = {};
      for (let key of Object.keys(response.data.Data)) {
        flat[key] = response.data.Data[key].Value;
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

exports.authRequestWithTicket = function (req, next) {
  const auth = req.headers.authorization.trim().split(' ');
  if (auth[0].toLowerCase() !== 'playfab') {
      return next()
  }
  const sessionTicket = auth[1];
  const titleId = sessionTicket.split('-')[3];
  if (req.resources.game && req.resources.game.playfab.title_id != null && req.resources.game.playfab.title_id.length > 0) {
    if (req.resources.game.playfab.title_id.trim() !== titleId) {
      next(new restify.errors.InvalidCredentialsError("The PlayFab session-ticket has to belong to the same PlayFab title as specified in the game's general configuration in Polynect."))
    }
  }
  return exports.authUserAsClient(titleId, sessionTicket)
    .then(response => {
      if (response.authorized !== true) {
        next(new restify.errors.InvalidCredentialsError())
      } else {
        const player = new Models.Account();
        player.player_id = response.playerId;
        player.role = 'playfab';
        req.user = player;
        next()
      }
    }).catch(response => next(new restify.errors.InvalidCredentialsError()))
}

exports.authUserAsClient = function (titleId, sessionTicket) {
  return request({
    method: 'POST',
    uri: buildUrl(titleId, 'Client/GetAccountInfo'),
    headers: {
      'X-Authentication': sessionTicket
    },
    json: true
  }).then(response => {
      if (response.status != 'OK') {
        throw new restify.errors.InvalidCredentialsError("Received a non-OK response from PlayFab")
      } else {
        return {
          authorized: true,
          playerId: response.data.AccountInfo.PlayFabId
        }
      }
    })
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