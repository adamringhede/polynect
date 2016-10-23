"use strict";

function getPlayers(model) {
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
  return {players: players, characters: characters};
}

module.exports = function (model, req) {

  let teams = [];
  if (model.teams && Array.isArray(model.teams) && model.teams.length > 0 && model.teams[0]._id != null) {
    teams = model.teams.map((m) => {
      const team = getPlayers(m);
      return {
        id: m._id,
        players: team.players,
        characters: team.characters
      }
    })
  }
  // TODO include delegations, need, etc.
  const playersAndCharacters = getPlayers(model);
  return {
    id: model._id,
    size: model.size,
    min: model.min,
    max: model.max,
    requests: req.user.role == 'admin' ? model.requests : null,
    game: {
      id: model.game.id,
      developer: model.game.developer
    },
    status: model.status,
    attributes: model.attributes,
    open: model.open,

    // Read only
    teams: teams,
    players: playersAndCharacters.players,
    characters: playersAndCharacters.characters,
  }
};

/*
As a developer I may want to see the player ids', delegations, match attributes, status
roles (need and delegations)
 */
