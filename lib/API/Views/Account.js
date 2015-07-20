var view = function (model) {
  return {
    id: model._id,
    email: model.email,
    username: model.username,
    firstname: model.firstname,
    lastname: model.lastname,
    role: model.role
  }
}
view.withToken = function (model, req) {
  var res = view(model);
  res.token = {
    token_type: 'bearer',
    access_token: req.oauth.token,
    expires: req.oauth.expires
  }
  return res;
}


module.exports = view;
