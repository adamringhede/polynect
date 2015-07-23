module.exports = function (model) {
  return {
    id: model._id,
    name: model.name,
    product_id: model.product_id,
    attributes: model.attributes,
    data: model.data,
    stackable: model.stackable,
    game: model.game
  }
}
