module.exports = function (model, req) {
  var players = [];
  var characters = [];
  for (var i = 0, l = model.requests.length; i < l; i++) {
    var player = model.requests[i].player;
    player.character =  model.requests[i].character;
    players.push(player);
    characters.push({
      id: model.requests[i].character.id,
      player: model.requests[i].player
    });
  }
  // TODO include delegations, need, etc.
  return {
    id: model._id,
    size: model.size,
    min: model.min,
    max: model.max,
    requests: req.user.role == 'admin' ? model.requests : null,
    game: model.game,
    status: model.status,
    attributes: model.attributes,
    open: model.open,

    // Calculated
    players: players,
    characters: characters,
  }
}

/*
As a developer I may want to see the player ids', delegations, match attributes, status
roles (need and delegations)
 */
