module.exports = function (model) {
  var view = {
    id: model._id,
    product_id: model.product_id,
    stackable: model.stackable,
    itemSpec: model.itemSpec,
    game: model.game,
    player: model.player,
    character: model.character,
    attributes: model.attributes
  }
  if (model.stackable) {
    view.count = model.count;
  } else {
    view.data = model.data;
  }
  return view;
}
