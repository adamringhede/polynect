var def = function (model) {
  return {
    id: model._id,
    username: model.username,
    game: model.game,
    data: model.data
  }
}

module.exports = def
