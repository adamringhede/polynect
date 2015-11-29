var view = function (model, req) {
  var res = {
    id: model._id,
    username: model.username,
    game: model.game,
    data: model.data
  };
  /* This can be used to make data merged with the rest of the request 
  if (req.user.role != 'admin') {
    for (name in model.data) {
      res[name] = model.data[name];
    }
    delete res.data;
  }
  */
  return res;
}

view.withToken = function (player, req) {
  var res = view(player, req);
  res.token = {
    token_type: 'bearer',
    access_token: req.oauth.token,
    expires: req.oauth.expires
  }
  return res;
}
module.exports = view
