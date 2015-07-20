var view = function (model) {
  return {
    id: model._id,
    username: model.username,
    game: model.game,
    data: model.data
  }
}

view.withToken = function (player, req) {
  var res = view(player);
  res.token = {
    token_type: 'bearer',
    access_token: req.oauth.token,
    expires: req.oauth.expires
  }
  return res;
}
module.exports = view
