module.exports = function (model, req) {
  var data = {
    id: model._id,
    name: model.name,
    developer: model.developer,
    matchmaking_config: model.matchmaking_config,
    playfab: model.playfab || undefined
  };
  if (req.user != null && req.user.role != 'player') {
    data.rate_limit = model.rate_limit;
  }
  return data;
}
