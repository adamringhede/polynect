var def = function (model) {
  return {
    id: model._id,
    username: model.username,
    game: model.game
  }
}

def.authenticated = function (model, newPlayer) {
  model.getToken();
  return {
    player_id: model._id,
    token: model.token,
    token_expires: model.token_expires,
    game: model.game
  }
}

module.exports = def
