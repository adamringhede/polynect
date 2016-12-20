module.exports = function (model) {
  return {
    id: model._id,
    url: model.url,
    secret: model.secret,
    enabled: model.enabled,
    game: model.game
  }
};
