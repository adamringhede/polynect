module.exports = function (model) {
  return {
    id: model._id,
    name: model.name,
    data: model.data,
    player: model.player,
    game: model.game
  }
}
