module.exports = function (model) {
  var players = [];
  for (var i = 0, l = model.requests.length; i < l; i++) {
    players.push(model.requests[i].player);
  }

  return {
    id: model._id,
    players: players,
    status: model.status,
    map: model.attributes,
  }
}

/*
As a developer I may want to see the player ids', delegations, match attributes, status
roles (need and delegations)
 */
