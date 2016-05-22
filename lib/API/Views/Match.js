module.exports = function (model, req) {
  var players = [];
  var characters = [];
  for (var i = 0, l = model.requests.length; i < l; i++) {
    players.push(model.requests[i].player);
    characters.push({
      id: model.requests[i].character.id,
      player: model.requests[i].player
    });
  }
  // TODO include delegations, need, etc.
  return {
    id: model._id,
    size: model.size,
    requests: req.user.role == 'admin' ? model.requests : null,
    players: players,
    characters: characters,
    status: model.status,
    attributes: model.attributes,
    open: model.open
  }
}

/*
As a developer I may want to see the player ids', delegations, match attributes, status
roles (need and delegations)
 */
