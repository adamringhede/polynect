var view = function (model) {
  return {
    id: model._id,
    username: model.username,
    game: model.game,
    data: model.data
  }
}

view.withToken = function (player, access_token) {
  var res = view(player);
  res.token = {
    token_type: 'bearer',
    access_token: access_token.token,
    expires_in: access_token.expires
  }
  return res;
}
module.exports = view
