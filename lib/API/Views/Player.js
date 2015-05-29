var def = function (model) {
  return {
    id: model._id,
  }
}

def.authenticated = function (model, newPlayer) {
  model.getToken();
  return {
    player_id: model._id,
    token: model.token,
    token_expires: model.token_expires,
    new: newPlayer
  }
}

module.exports = def
